import dash_gantt
from dash import Dash, callback, html, Input, Output, State, dcc
import json
from datetime import datetime
import pandas as pd
import numpy as np
import random

# Load and prepare data
df = pd.read_csv('chatgpt-01.csv')
df['datetime'] = pd.to_datetime(df['datetime'])  # Convert datetime column to datetime type

# Print column names and first row for debugging
print("Available columns:", df.columns.tolist())
print("\nFirst row of data:")
print(df.iloc[0])

# Get unique dates from the data
available_dates = sorted(df['datetime'].dt.date.unique().astype(str))

app = Dash(__name__)

# Apply styles matching Plotly's simple_white theme
app.layout = html.Div([
    html.H1("Scheduling Tool with Booking Predictions", 
            style={'color': '#444', 'fontWeight': '400', 'marginBottom': '25px'}),
    
    html.Div([
        html.Label("Select Date:", style={'color': '#444', 'marginRight': '10px', 'fontSize': '14px'}),
        dcc.DatePickerSingle(
            id='date-picker',
            date=available_dates[0],  # Set default to first available date
            min_date_allowed=available_dates[0],
            max_date_allowed=available_dates[-1],
            display_format='YYYY-MM-DD'
        )
    ], style={'marginBottom': '20px', 'display': 'flex', 'alignItems': 'center'}),
    
    # Add a store component to hold the current state of the data
    dcc.Store(id='data-store', data={}),
    
    dash_gantt.DashGantt(
        id='gantt-chart',
        rawData=[],  # Will be populated by callback
        date=available_dates[0],
        startHour=6,
        endHour=23,
        slotDuration=5,  # 5-minute slots
        backgroundColor='#ffffff'
    ),
    
    html.Div([
        html.H3("Number of rows in data", style={'color': '#444', 'fontWeight': '400', 'marginBottom': '10px'}),
        html.H3(id='num-rows', style={'color': '#444', 'fontWeight': '400', 'marginBottom': '10px'}),
        html.H3("Raw Data (for Prediction Model)", 
                style={'color': '#444', 'fontWeight': '400', 'marginBottom': '10px'}),
        html.Pre(id='raw-data', style={
            'backgroundColor': '#fafafa',
            'padding': '15px',
            'borderRadius': '4px',
            'whiteSpace': 'pre-wrap',
            'border': '1px solid #eaeaea',
            'fontSize': '13px',
            'color': '#333'
        })
    ], style={'marginTop': '30px'})
], style={'fontFamily': 'Arial, sans-serif', 'margin': '20px', 'maxWidth': '1200px', 'marginLeft': 'auto', 'marginRight': 'auto'})

# Define a function to add random probabilities to data
def add_random_probabilities(data_list):
    """Add random booking probabilities to each item in the data list"""
    for item in data_list:
        item['bookingProbability'] = round(random.random(), 2)  # Random value between 0 and 1
    return data_list

@callback(
    [Output('gantt-chart', 'rawData'),
     Output('raw-data', 'children'),
     Output('num-rows', 'children'),
     Output('data-store', 'data')],
    [Input('date-picker', 'date')],
    [State('data-store', 'data')]
)
def update_gantt_data(selected_date, data_store):
    if not selected_date:
        return [], "No date selected.", "0", {}
    
    # Check if we already have processed data for this date
    if selected_date in data_store:
        raw_data = data_store[selected_date]
    else:
        # Filter data for the selected date
        df['date'] = df['datetime'].dt.date.astype(str)
        df_filtered = df[df['date'] == selected_date]
        
        # Convert filtered data to list of dictionaries and handle datetime serialization
        raw_data = []
        for _, row in df_filtered.iterrows():
            try:
                data_dict = {
                    'datetime': row['datetime'].strftime('%Y-%m-%d %H:%M'),
                    'toimipiste': str(row['toimipiste']),
                    'aikaryhman': str(row['aikaryhman']),
                    'aikaryhma': str(row['aikaryhma']),
                    'laakari': str(row['laakari']),
                    'RESURSSI': str(row['RESURSSI']),
                    'specialty': str(row['ETNS']),  # Changed from ETNS to specialty
                    'ETNS_A': int(row['ETNS_A']),
                    'kesto_min': int(row['kesto_min']),
                    'ETNS_B': int(row['ETNS_B']),
                    'tyhja': int(row['tyhja'])
                }
                raw_data.append(data_dict)
            except Exception as e:
                print(f"Error processing row: {row}")
                print(f"Error details: {str(e)}")
                continue
        
        # Add random booking probabilities to the data
        raw_data = add_random_probabilities(raw_data)
        
        # Save processed data for this date
        data_store[selected_date] = raw_data
    
    # Format raw data for display
    raw_data_display = json.dumps(raw_data, indent=2)
    
    return raw_data, raw_data_display, str(len(raw_data)), data_store

@callback(
    Output('gantt-chart', 'rawData', allow_duplicate=True),
    Input('gantt-chart', 'rawData'),
    prevent_initial_call=True
)
def update_with_probabilities(gantt_data):
    """Apply random probabilities to the data whenever it changes"""
    if not gantt_data:
        return gantt_data
        
    # Add random probabilities to simulate prediction model
    updated_data = add_random_probabilities(gantt_data)
    
    print(f"Applied random probabilities to {len(updated_data)} timeslots")
    
    return updated_data

@callback(
    [Output('raw-data', 'children', allow_duplicate=True),
     Output('num-rows', 'children', allow_duplicate=True),
     Output('data-store', 'data', allow_duplicate=True)],
    [Input('gantt-chart', 'rawData')],
    [State('date-picker', 'date'),
     State('data-store', 'data')],
    prevent_initial_call=True
)
def handle_gantt_updates(updated_raw_data, current_date, data_store):
    if not updated_raw_data or not current_date:
        return "No data available.", "0", data_store
    
    # Print for debugging
    print(f"Handling update from Gantt chart - {len(updated_raw_data)} timeslots")
    
    # Update the data store with the new data for the current date
    data_store[current_date] = updated_raw_data
    
    # Format raw data for display
    raw_data_display = json.dumps(updated_raw_data, indent=2)
    
    return raw_data_display, str(len(updated_raw_data)), data_store

@callback(
    Output('gantt-chart', 'date'),
    Input('date-picker', 'date')
)
def update_gantt_date(date):
    return date

if __name__ == '__main__':
    app.run(debug=True)
