import dash_gantt
from dash import Dash, callback, html, Input, Output, State, dcc
import json
from datetime import datetime

# Sample data
professionals = [
    {"id": 1, "name": "John Doe"},
    {"id": 2, "name": "Jane Smith"},
    {"id": 3, "name": "Bob Johnson"}
]

# Sample timeslots using the date from the screenshot
timeslots = [
    {
        "id": 1,
        "professionalId": 1,
        "start": "09:00",
        "end": "10:00",
        "date": "2025-03-14",
        "bookingProbability": 0.75
    },
    {
        "id": 2,
        "professionalId": 1,
        "start": "14:00",
        "end": "15:00",
        "date": "2025-03-14",
        "bookingProbability": 0.45
    },
    {
        "id": 3,
        "professionalId": 2,
        "start": "10:00",
        "end": "11:00",
        "date": "2025-03-14",
        "bookingProbability": 0.90
    }
]

app = Dash(__name__)

app.layout = html.Div([
    html.H1("Scheduling Tool with Booking Predictions"),
    
    html.Div([
        html.Label("Select Date:"),
        dcc.DatePickerSingle(
            id='date-picker',
            date="2025-03-14",
            display_format='YYYY-MM-DD'
        )
    ], style={'margin-bottom': '20px'}),
    
    dash_gantt.DashGantt(
        id='gantt-chart',
        professionals=professionals,
        timeslots=timeslots,
        date="2025-03-14",
        startHour=6,
        endHour=24,
        slotDuration=5
    ),
    
    html.Div([
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
    
    # Format the timeslots data as JSON for display
    return json.dumps(timeslots, indent=2)


@callback(
    Output('gantt-chart', 'date'),
    Input('date-picker', 'date')
)
def update_gantt_date(date):
    return date


if __name__ == '__main__':
    app.run(debug=True)
