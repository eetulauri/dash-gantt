# Dash Gantt Chart Component

A custom Gantt chart component for Dash that serves as a scheduling tool for employers to manage timeslots for professionals. The component allows users to add, modify, and remove timeslots, and outputs data that can be used in a prediction model to estimate the likelihood of timeslots being booked by customers.

## Features

- Display professionals vertically and time horizontally for a specific day
- Add, modify, and remove timeslots with an intuitive interface
- Output data in a format compatible with pandas DataFrame
- Display booking probability predictions for each timeslot
- Customizable time range and slot duration
- Direct integration with raw data from CSV/database

## Installation

```bash
pip install dash-gantt
```

## Usage

```python
import dash_gantt
from dash import Dash, callback, html, Input, Output, dcc
import pandas as pd
from datetime import datetime

# Load data from CSV or database
df = pd.read_csv('appointments.csv')
df['datetime'] = pd.to_datetime(df['datetime'])

# Get unique dates from the data
available_dates = sorted(df['datetime'].dt.date.unique().astype(str))

app = Dash(__name__)

app.layout = html.Div([
    html.H1("Scheduling Tool"),
    
    # Date picker
    dcc.DatePickerSingle(
        id='date-picker',
        date=available_dates[0],
        min_date_allowed=available_dates[0],
        max_date_allowed=available_dates[-1],
        display_format='YYYY-MM-DD'
    ),
    
    # Gantt chart
    dash_gantt.DashGantt(
        id='gantt-chart',
        rawData=[],  # Will be populated by callback
        date=available_dates[0],
        startHour=6,
        endHour=24,
        slotDuration=5
    ),
    
    # Display raw data
    html.Div(id='raw-data')
])

@callback(
    [Output('gantt-chart', 'rawData'),
     Output('raw-data', 'children')],
    [Input('date-picker', 'date')]
)
def update_gantt_data(selected_date):
    if not selected_date:
        return [], "No date selected."
    
    # Filter data for the selected date
    df['date'] = df['datetime'].dt.date.astype(str)
    df_filtered = df[df['date'] == selected_date]
    
    # Convert filtered data to list of dictionaries
    raw_data = df_filtered.to_dict('records')
    
    return raw_data, json.dumps(raw_data, indent=2)

if __name__ == '__main__':
    app.run(debug=True)
```

## Component Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| id | string | The ID used to identify this component in Dash callbacks | None |
| rawData | array | Raw data from CSV/database in the format shown below | [] |
| date | string | The date to display in the Gantt chart (YYYY-MM-DD) | Today's date |
| startHour | number | The start hour of the day (e.g., 6 for 6:00 AM) | 6 |
| endHour | number | The end hour of the day (e.g., 24 for midnight) | 24 |
| slotDuration | number | The duration of each slot in minutes | 5 |
| backgroundColor | string | The background color for the header row | '#f5f5f5' |
| onDataChange | function | Callback function called when data changes | null |

## Data Structure

### Raw Data Format
```javascript
[
  {
    datetime: "2024-01-01 08:00",  // Format: "YYYY-MM-DD HH:MM"
    toimipiste: "Lääkäriasema Koski",
    aikaryhman: "In-person appointment",  // In-person or Remote
    aikaryhma: "IA",
    laakari: "Dr. A",
    RESURSSI: "Gynecology",
    ETNS: 1,
    ETNS_A: 1,
    kesto_min: 20,  // Duration in minutes
    ETNS_B: 1,
    tyhja: 1  // 0 if booked, 1 if available
  }
]
```

## Integration with Prediction Model

The component outputs raw data that can be used in a pandas DataFrame for prediction models. Here's an example of how to integrate with a prediction model:

```python
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import numpy as np

@callback(
    Output('gantt-chart', 'rawData'),
    Input('gantt-chart', 'rawData'),
    prevent_initial_call=True
)
def predict_booking_probability(raw_data):
    if not raw_data:
        return raw_data
    
    # Convert raw data to DataFrame
    df = pd.DataFrame(raw_data)
    
    # Extract features (example)
    df['hour'] = pd.to_datetime(df['datetime']).dt.hour
    df['is_morning'] = df['hour'] < 12
    
    # Assume we have a trained model
    model = RandomForestClassifier()
    # model.fit(X_train, y_train)  # Train the model (not shown here)
    
    # For demonstration, we'll use random probabilities
    # In a real scenario, you would use: probabilities = model.predict_proba(df[features])[:, 1]
    probabilities = np.random.random(len(df))
    
    # Update raw data with predictions
    for i, prob in enumerate(probabilities):
        raw_data[i]['bookingProbability'] = float(prob)
    
    return raw_data
```

## Development

To develop the component:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Visit http://localhost:8050 in your browser

## License

MIT 