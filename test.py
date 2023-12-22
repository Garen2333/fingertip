import pandas as pd
import matplotlib.pyplot as plt

# Load the data from the CSV file
file_path = 'onBodyData_after_meal_custom.csv'  # Replace with the path to your CSV file
data = pd.read_csv(file_path)

# Convert the 'Time' column to datetime
data['Time'] = pd.to_datetime(data['Time'])

# Plotting the data
plt.figure(figsize=(10, 5))

# Plot Vitamin C levels
plt.plot(data['Time'], data['VitaminC (mg/dL)'], label='Vitamin C (mg/dL)', color='orange')

# Plot Glucose levels
plt.plot(data['Time'], data['Glucose (mg/dL)'], label='Glucose (mg/dL)', color='blue')

# Adding labels and title
plt.xlabel('Time')
plt.ylabel('Concentration (mg/dL)')
plt.title('Vitamin C and Glucose Levels Over Time After a Meal')
plt.legend()

# Formatting the x-axis to show the time nicely
plt.gcf().autofmt_xdate()

plt.show()
