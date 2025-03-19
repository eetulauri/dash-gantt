import dash_gantt
from dash import Dash, callback, html, Input, Output, State, dcc
import json
from datetime import datetime
import pandas as pd
import numpy as np

# Function to transform CSV data into Gantt chart format
def transform_csv_to_gantt_data(df, date):
    # Filter data for the specific date
    df['datetime'] = pd.to_datetime(df['datetime'])
    df['date'] = df['datetime'].dt.date.astype(str)
    df_filtered = df[df['date'] == date]
    
    # Create professionals list from unique doctors
    professionals = [
        {"id": idx + 1, "name": doctor}
        for idx, doctor in enumerate(df_filtered['laakari'].unique())
    ]
    
    # Create doctor to id mapping
    doctor_to_id = {doctor: idx + 1 for idx, doctor in enumerate(df_filtered['laakari'].unique())}
    
    # Transform timeslots
    timeslots = []
    for _, row in df_filtered.iterrows():
        start_time = row['datetime'].strftime('%H:%M')
        
        # Calculate end time based on duration
        end_datetime = row['datetime'] + pd.Timedelta(minutes=row['kesto_min'])
        end_time = end_datetime.strftime('%H:%M')
        
        # Create timeslot entry
        timeslot = {
            "id": len(timeslots) + 1,
            "professionalId": doctor_to_id[row['laakari']],
            "start": start_time,
            "end": end_time,
            "date": date,
            "bookingProbability": 0.5,  # Default probability, will be updated by prediction model
            "isBooked": row['tyhja'] == 0,  # True if slot is booked
            "appointmentType": row['aikaryhman'],  # In-person or Remote
            "resource": row['RESURSSI']
        }
        timeslots.append(timeslot)
    
    return professionals, timeslots

# Load and prepare data
df = pd.read_csv('chatgpt-01.csv')
df['datetime'] = pd.to_datetime(df['datetime'])  # Convert datetime column to datetime type

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
        professionals=[],  # Will be populated by callback
        timeslots=[],     # Will be populated by callback
        date=available_dates[0],
        startHour=6,
        endHour=24,
        slotDuration=5,  # 5-minute slots
        backgroundColor='#ffffff'
    ),
    
    html.Div([
        html.H3("Timeslot Data (for Prediction Model)", 
                style={'color': '#444', 'fontWeight': '400', 'marginBottom': '10px'}),
        html.Pre(id='timeslot-data', style={
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
    [Output('gantt-chart', 'professionals'),
     Output('gantt-chart', 'timeslots'),
     Output('timeslot-data', 'children')],
    [Input('date-picker', 'date')]
)
def update_gantt_data(selected_date):
    if not selected_date:
        return [], [], "No date selected."
    
    # Transform CSV data for the selected date
    professionals, timeslots = transform_csv_to_gantt_data(df, selected_date)
    
    # Format timeslots data for display
    timeslots_display = json.dumps(timeslots, indent=2)
    
    return professionals, timeslots, timeslots_display

@callback(
    Output('gantt-chart', 'date'),
    Input('date-picker', 'date')
)
def update_gantt_date(date):
    return date

if __name__ == '__main__':
    app.run(debug=True)
