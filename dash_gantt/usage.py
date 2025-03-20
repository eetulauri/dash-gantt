import dash_gantt
from dash import Dash, callback, html, Input, Output, State, dcc
import json
from datetime import datetime
import pandas as pd
import numpy as np

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
    
    dash_gantt.DashGantt(
        id='gantt-chart',
        rawData=[],  # Will be populated by callback
        date=available_dates[0],
        startHour=6,
        endHour=24,
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

@callback(
    [Output('gantt-chart', 'rawData'),
     Output('raw-data', 'children'),
     Output('num-rows', 'children')],
    [Input('date-picker', 'date')]
)
def update_gantt_data(selected_date):
    if not selected_date:
        return [], "No date selected.", "0"
    
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
    
    # Format raw data for display
    raw_data_display = json.dumps(raw_data, indent=2)
    
    return raw_data, raw_data_display, str(len(raw_data))

# Add a new callback to handle updates from the Gantt chart component
@callback(
    [Output('raw-data', 'children', allow_duplicate=True),
     Output('num-rows', 'children', allow_duplicate=True)],
    [Input('gantt-chart', 'rawData')],
    prevent_initial_call=True
)
def process_gantt_updates(updated_raw_data):
    if not updated_raw_data:
        return "No data available.", "0"
    
    # Print for debugging
    print(f"Received update from Gantt chart - {len(updated_raw_data)} timeslots")
    
    # Here you could process the data for your prediction model
    # For example:
    # updated_df = pd.DataFrame(updated_raw_data)
    # predictions = my_prediction_model.predict(updated_df)
    
    # Format raw data for display
    raw_data_display = json.dumps(updated_raw_data, indent=2)
    
    return raw_data_display, str(len(updated_raw_data))

@callback(
    Output('gantt-chart', 'date'),
    Input('date-picker', 'date')
)
def update_gantt_date(date):
    return date

if __name__ == '__main__':
    app.run(debug=True)
