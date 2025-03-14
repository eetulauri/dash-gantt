import dash_gantt
from dash import Dash, callback, html, Input, Output, State, dcc
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Sample data
professionals = [
    {"id": 1, "name": "John Doe"},
    {"id": 2, "name": "Jane Smith"},
    {"id": 3, "name": "Bob Johnson"}
]

# Generate some sample timeslots
timeslots = []
slot_id = 1
today = datetime.now().strftime('%Y-%m-%d')

# Add some timeslots for each professional
for prof_id in range(1, 4):
    # Morning slots
    for hour in [9, 10, 11]:
        if np.random.random() > 0.5:  # Randomly add some slots
            timeslots.append({
                "id": slot_id,
                "professionalId": prof_id,
                "start": f"{hour:02d}:00",
                "end": f"{hour+1:02d}:00",
                "date": today
            })
            slot_id += 1
    
    # Afternoon slots
    for hour in [13, 14, 15, 16]:
        if np.random.random() > 0.5:  # Randomly add some slots
            timeslots.append({
                "id": slot_id,
                "professionalId": prof_id,
                "start": f"{hour:02d}:00",
                "end": f"{hour+1:02d}:00",
                "date": today
            })
            slot_id += 1

app = Dash(__name__)

app.layout = html.Div([
    html.H1("Scheduling Tool with Booking Predictions"),
    
    html.Div([
        html.Label("Select Date:"),
        dcc.DatePickerSingle(
            id='date-picker',
            date=datetime.now().date(),
            display_format='YYYY-MM-DD'
        ),
        html.Button("Run Prediction Model", id="run-prediction", style={
            'marginLeft': '20px',
            'backgroundColor': '#4CAF50',
            'color': 'white',
            'border': 'none',
            'padding': '10px 15px',
            'borderRadius': '4px',
            'cursor': 'pointer'
        })
    ], style={'marginBottom': '20px'}),
    
    dash_gantt.DashGantt(
        id='gantt-chart',
        professionals=professionals,
        timeslots=timeslots,
        date=today,
        startHour=8,
        endHour=18,
        slotDuration=60
    ),
    
    html.Div([
        html.H3("Prediction Model Explanation"),
        html.P([
            "This example demonstrates how to integrate the Gantt chart component with a prediction model. ",
            "The model predicts the likelihood of each timeslot being booked by customers based on various features:"
        ]),
        html.Ul([
            html.Li("Time of day (morning vs. afternoon)"),
            html.Li("Day of week"),
            html.Li("Professional's popularity"),
            html.Li("Historical booking patterns")
        ]),
        html.P("Click the 'Run Prediction Model' button to simulate running the prediction model on the current timeslots."),
        
        html.H3("Timeslot Data (for Prediction Model)"),
        html.Pre(id='timeslot-data', style={
            'backgroundColor': '#f8f9fa',
            'padding': '15px',
            'borderRadius': '5px',
            'whiteSpace': 'pre-wrap'
        })
    ], style={'marginTop': '30px'})
])


@callback(
    Output('timeslot-data', 'children'),
    Input('gantt-chart', 'timeslots')
)
def display_timeslot_data(timeslots):
    if not timeslots:
        return "No timeslots available."
    
    # Convert to pandas DataFrame for display
    df = pd.DataFrame(timeslots)
    
    # Format the DataFrame as a string
    return f"DataFrame Shape: {df.shape}\n\n" + df.to_string()


@callback(
    Output('gantt-chart', 'date'),
    Input('date-picker', 'date')
)
def update_gantt_date(date):
    return date


@callback(
    Output('gantt-chart', 'timeslots'),
    Input('run-prediction', 'n_clicks'),
    State('gantt-chart', 'timeslots'),
    prevent_initial_call=True
)
def run_prediction_model(n_clicks, timeslots):
    if not timeslots:
        return timeslots
    
    # Convert timeslots to DataFrame for feature extraction
    df = pd.DataFrame(timeslots)
    
    # Extract features
    df['hour'] = df['start'].apply(lambda x: int(x.split(':')[0]))
    df['is_morning'] = df['hour'] < 12
    
    # Simple prediction model (for demonstration)
    # In a real scenario, you would use a trained machine learning model
    
    # Feature 1: Time of day effect (morning slots are more popular)
    time_factor = df['is_morning'].apply(lambda x: 0.2 if x else -0.1)
    
    # Feature 2: Professional popularity (based on ID for demo)
    prof_factor = df['professionalId'].apply(lambda x: 0.1 if x == 1 else (0.2 if x == 2 else 0))
    
    # Feature 3: Random factor (to simulate other unknown variables)
    random_factor = np.random.normal(0, 0.1, len(df))
    
    # Calculate probability (base probability + factors, clamped between 0 and 1)
    base_probability = 0.5  # 50% base probability
    probabilities = np.clip(base_probability + time_factor + prof_factor + random_factor, 0, 1)
    
    # Update timeslots with predictions
    for i, prob in enumerate(probabilities):
        timeslots[i]['bookingProbability'] = float(prob)
    
    return timeslots


if __name__ == '__main__':
    app.run(debug=True) 