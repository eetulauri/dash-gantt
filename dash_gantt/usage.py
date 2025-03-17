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
    },
    {
        "id": 4,
        "professionalId": 3,
        "start": "09:30",
        "end": "10:00",
        "date": "2025-03-14",
        "bookingProbability": 0.50
    }
]

app = Dash(__name__)

# Apply styles matching Plotly's simple_white theme
app.layout = html.Div([
    html.H1("Scheduling Tool with Booking Predictions", 
            style={'color': '#444', 'fontWeight': '400', 'marginBottom': '25px'}),
    
    html.Div([
        html.Label("Select Date:", style={'color': '#444', 'marginRight': '10px', 'fontSize': '14px'}),
        dcc.DatePickerSingle(
            id='date-picker',
            date="2025-03-14",
            display_format='YYYY-MM-DD'
        )
    ], style={'marginBottom': '20px', 'display': 'flex', 'alignItems': 'center'}),
    
    dash_gantt.DashGantt(
        id='gantt-chart',
        professionals=professionals,
        timeslots=timeslots,
        date="2025-03-14",
        startHour=6,
        endHour=24,
        slotDuration=5,  # 5-minute slots as per business requirements
        backgroundColor='#ffffff'  # White background to match simple_white theme
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
