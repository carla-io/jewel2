import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function AdminDashboard() {
  const [salesData, setSalesData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState("year"); // "year" or "6months" or "3months"

  const screenWidth = Dimensions.get("window").width - 40;
  
  useEffect(() => {
    fetchMonthlySalesData();
  }, []);

  const fetchMonthlySalesData = async () => {
    setLoading(true);
    try {
      // You could add query parameters for date filtering
      const response = await fetch("http://192.168.144.237:4000/api/order/monthly-sales");
      const data = await response.json();
      
      if (data.success && data.salesData) {
        // Format the data from the updated API response
        const formattedData = data.salesData.map(item => {
          // Convert month number to month name if it's not already included
          let monthName = item.monthName;
          if (!monthName) {
            const monthNames = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];
            monthName = monthNames[(item.month - 1) % 12];
          }
          
          return {
            year: item.year || new Date().getFullYear(),
            month: item.month || 1,
            monthName: monthName,
            totalSales: item.totalSales || 0,
            orderCount: item.orderCount || 0,
            avgOrderValue: item.avgOrderValue || 0
          };
        });
        
        setSalesData(formattedData);
        setSummary(data.summary || null);
      } else {
        setError(data.message || "Failed to load sales data");
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setError("Network or server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected time frame
  const getFilteredData = () => {
    if (!salesData.length) return [];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    let filtered = [...salesData];
    
    if (timeFrame === "3months") {
      // Filter to last 3 months
      filtered = filtered.filter(item => {
        const date = new Date(item.year, item.month - 1);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return date >= threeMonthsAgo;
      });
    } else if (timeFrame === "6months") {
      // Filter to last 6 months
      filtered = filtered.filter(item => {
        const date = new Date(item.year, item.month - 1);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return date >= sixMonthsAgo;
      });
    }
    
    return filtered;
  };

  // Prepare data for the chart
  const prepareChartData = () => {
    const filteredData = getFilteredData();
    
    return {
      labels: filteredData.map(item => item.monthName ? item.monthName.substring(0, 3) : ""),
      datasets: [
        {
          data: filteredData.map(item => item.totalSales),
          color: () => `rgba(75, 192, 192, 1)`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const calculateTimePeriodSummary = () => {
    const filteredData = getFilteredData();
    
    if (!filteredData.length) return null;
    
    const totalOrders = filteredData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
    
    return {
      totalSales: filteredData.reduce((sum, item) => sum + (item.totalSales || 0), 0).toFixed(2),
      totalOrders: totalOrders,
      avgOrderValue: totalOrders > 0 ? 
        (filteredData.reduce((sum, item) => sum + (item.totalSales || 0), 0) / totalOrders).toFixed(2) :
        "0.00",
      bestMonth: filteredData.reduce((best, current) => 
        (current.totalSales || 0) > (best.totalSales || 0) ? current : best, filteredData[0])
    };
  };

  const periodSummary = calculateTimePeriodSummary();

  // Handle old API format where data might still have _id structure
  const formatOldApiResponse = (item) => {
    if (item._id && typeof item._id === 'object') {
      // Handle old API response format
      return {
        month: item._id.month || 1,
        year: item._id.year || new Date().getFullYear(),
        monthName: getMonthName(item._id.month),
        totalSales: item.totalSales || 0,
        orderCount: item.count || 0,
        avgOrderValue: 0 // Can't calculate this from old API format
      };
    }
    return item;
  };

  const getMonthName = (monthNum) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[(monthNum - 1) % 12] || "Unknown";
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {/* Time frame selection */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, timeFrame === "3months" && styles.activeFilter]}
          onPress={() => setTimeFrame("3months")}
        >
          <Text style={[styles.filterText, timeFrame === "3months" && styles.activeFilterText]}>3 Months</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, timeFrame === "6months" && styles.activeFilter]}
          onPress={() => setTimeFrame("6months")}
        >
          <Text style={[styles.filterText, timeFrame === "6months" && styles.activeFilterText]}>6 Months</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, timeFrame === "year" && styles.activeFilter]}
          onPress={() => setTimeFrame("year")}
        >
          <Text style={[styles.filterText, timeFrame === "year" && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e73df" />
          <Text style={styles.loadingText}>Loading sales data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMonthlySalesData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          {periodSummary && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Sales</Text>
                <Text style={styles.summaryValue}> ₱{periodSummary.totalSales}</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Orders</Text>
                <Text style={styles.summaryValue}>{periodSummary.totalOrders}</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Avg Order</Text>
                <Text style={styles.summaryValue}> ₱{periodSummary.avgOrderValue}</Text>
              </View>
            </View>
          )}

          {/* Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Monthly Sales</Text>

            {getFilteredData().length > 0 ? (
              <LineChart
                data={prepareChartData()}
                width={screenWidth}
                height={220}
                yAxisLabel=" ₱"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(78, 115, 223,  ₱{opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0,  ₱{opacity})`,
                  style: { borderRadius: 10 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#4e73df" },
                  propsForLabels: { fontSize: 11 },
                }}
                bezier
                fromZero
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>No sales data available for the selected period.</Text>
            )}
          </View>

          {/* Best Month Card */}
          {periodSummary?.bestMonth && (
            <View style={styles.bestMonthCard}>
              <Text style={styles.bestMonthTitle}>Best Month</Text>
              <Text style={styles.bestMonthName}>
                {periodSummary.bestMonth.monthName || getMonthName(periodSummary.bestMonth.month)} {periodSummary.bestMonth.year}
              </Text>
              <Text style={styles.bestMonthValue}> ₱{(periodSummary.bestMonth.totalSales || 0).toFixed(2)}</Text>
              <Text style={styles.bestMonthOrders}>{periodSummary.bestMonth.orderCount || 0} orders</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8f9fc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#5a5c69",
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#e8e8e8",
  },
  activeFilter: {
    backgroundColor: "#4e73df",
  },
  filterText: {
    color: "#5a5c69",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  errorText: {
    color: "#e74a3b",
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#4e73df",
    borderRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "500",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#858796",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5a5c69",
  },
  chartContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#5a5c69",
  },
  chart: {
    borderRadius: 8,
    paddingRight: 15,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 14,
    color: "#858796",
    marginVertical: 30,
  },
  bestMonthCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bestMonthTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5a5c69",
    marginBottom: 5,
  },
  bestMonthName: {
    fontSize: 18,
    color: "#5a5c69",
    marginBottom: 5,
  },
  bestMonthValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1cc88a",
    marginBottom: 5,
  },
  bestMonthOrders: {
    fontSize: 14,
    color: "#858796",
  }
});