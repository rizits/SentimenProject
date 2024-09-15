import os
import pandas as pd

# Get the current directory where the Python script is located
current_directory = os.path.dirname(os.path.abspath(__file__))

# Get a list of all CSV files in the current directory
csv_files = [file for file in os.listdir(current_directory) if file.endswith('.csv')]

# Initialize an empty list to store dataframes
df_list = []

# Loop through each CSV file and read them into a pandas dataframe
for file in csv_files:
    file_path = os.path.join(current_directory, file)
    df = pd.read_csv(file_path)
    df_list.append(df)

# Concatenate all dataframes into one
merged_df = pd.concat(df_list, ignore_index=True)

# Save the merged dataframe to a new CSV file in the current directory
output_file = os.path.join(current_directory, 'bbc-all.csv')
merged_df.to_csv(output_file, index=False)

print(f'All CSV files have been merged into {output_file}')
