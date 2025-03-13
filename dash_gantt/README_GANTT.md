# Dash Gantt Chart Component

A custom Gantt chart component for Dash that serves as a scheduling tool for employers to manage timeslots for professionals. The component allows users to add, modify, and remove timeslots, and outputs data that can be used in a prediction model to estimate the likelihood of timeslots being booked by customers.

## Features

- Display professionals vertically and time horizontally for a specific day
- Add, modify, and remove timeslots with an intuitive interface
- Output data in a format compatible with pandas DataFrame
- Display booking probability predictions for each timeslot
- Customizable time range and slot duration

## Installation

```bash
pip install dash-gantt
```

## Usage

```python
import dash_gantt
from dash import Dash, callback, html, Input, Output, dcc
import json
from datetime import datetime

# Sample data
professionals = [
    {"id": 1, "name": "John Doe"},
    {"id": 2, "name": "Jane Smith"}
]

timeslots = [
    {
        "id": 1,
        "professionalId": 1,
        "start": "09:00",
        "end": "10:00",
        "date": "2023-03-13",
        "bookingProbability": 0.75
    }
]

app = Dash(__name__)

app.layout = html.Div([
    html.H1("Scheduling Tool"),
    
    dash_gantt.DashGantt(
        id='gantt-chart',
        professionals=professionals,
        timeslots=timeslots,
        date=datetime.now().strftime('%Y-%m-%d'),
        startHour=8,
        endHour=18,
        slotDuration=60
    ),
    
    html.Div(id='output')
])

@callback(
    Output('output', 'children'),
    Input('gantt-chart', 'timeslots')
)
def display_output(timeslots):
    return json.dumps(timeslots, indent=2)

if __name__ == '__main__':
    app.run(debug=True)
```

## Component Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| id | string | The ID used to identify this component in Dash callbacks | None |
| professionals | array | List of professionals to display in the Gantt chart. Each professional should have an id and name. | Required |
| timeslots | array | List of timeslots to display in the Gantt chart. Each timeslot should have an id, professionalId, start time, end time, and date. | [] |
| date | string | The date to display in the Gantt chart (YYYY-MM-DD) | Today's date |
| startHour | number | The start hour of the day (e.g., 8 for 8:00 AM) | 8 |
| endHour | number | The end hour of the day (e.g., 18 for 6:00 PM) | 18 |
| slotDuration | number | The duration of each slot in minutes | 60 |

## Data Structure

### Professionals

```javascript
[
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" }
]
```

### Timeslots

```javascript
[
  { 
    id: 1, 
    professionalId: 1, 
    start: "09:00", 
    end: "10:00", 
    date: "2023-03-13",
    bookingProbability: 0.75 // Optional: Added by prediction model
  }
]
```

## Integration with Prediction Model

The component outputs timeslot data that can be used in a pandas DataFrame for prediction models. Here's an example of how to integrate with a prediction model:

```python
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import numpy as np

@callback(
    Output('gantt-chart', 'timeslots'),
    Input('gantt-chart', 'timeslots'),
    prevent_initial_call=True
)
def predict_booking_probability(timeslots):
    if not timeslots:
        return timeslots
    
    # Convert timeslots to DataFrame
    df = pd.DataFrame(timeslots)
    
    # Extract features (example)
    df['hour'] = df['start'].apply(lambda x: int(x.split(':')[0]))
    df['is_morning'] = df['hour'] < 12
    
    # Assume we have a trained model
    model = RandomForestClassifier()
    # model.fit(X_train, y_train)  # Train the model (not shown here)
    
    # For demonstration, we'll use random probabilities
    # In a real scenario, you would use: probabilities = model.predict_proba(df[features])[:, 1]
    probabilities = np.random.random(len(df))
    
    # Update timeslots with predictions
    for i, prob in enumerate(probabilities):
        timeslots[i]['bookingProbability'] = float(prob)
    
    return timeslots
```

## Customization

The component can be customized by modifying the CSS styles. The component uses the following CSS classes:

- `dash-gantt`: The main container
- `dash-gantt-header`: The header container
- `dash-gantt-container`: The container for the Gantt chart
- `dash-gantt-time-header`: The header for the time axis
- `dash-gantt-row`: A row for a professional
- `dash-gantt-professional`: The cell containing the professional's name
- `dash-gantt-cell`: A cell in the Gantt chart
- `dash-gantt-slot`: A timeslot in the Gantt chart
- `dash-gantt-probability`: The container for the booking probability
- `dash-gantt-editor`: The editor for adding/modifying timeslots

## Development

To develop the component:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Visit http://localhost:8050 in your browser

## License

MIT 