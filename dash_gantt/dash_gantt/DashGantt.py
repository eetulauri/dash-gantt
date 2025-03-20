# AUTO GENERATED FILE - DO NOT EDIT

from dash.development.base_component import Component, _explicitize_args


class DashGantt(Component):
    """A DashGantt component.
DashGantt is a Gantt chart component for scheduling.
It displays professionals vertically and time horizontally.
Users can add, modify, and remove timeslots for each professional.
The component outputs data that can be used in a prediction model.

Keyword arguments:

- id (string; optional):
    The ID used to identify this component in Dash callbacks.

- backgroundColor (string; default '#f5f5f5'):
    The background color for the header row.

- date (string; default new Date().toISOString().split('T')[0]):
    The date to display in the Gantt chart (YYYY-MM-DD).

- endHour (number; default 24):
    The end hour of the day (e.g., 24 for midnight).

- rawData (list of dicts; optional):
    Raw data from CSV/database in the format: [   {     datetime:
    string, // Format: \"YYYY-MM-DD HH:MM\"     laakari: string, //
    Doctor name     kesto_min: number, // Duration in minutes
    tyhja: number, // 0 if booked, 1 if available
    bookingProbability?: number, // Optional, defaults to 0.5 if not
    provided     // Additional fields are allowed and will be
    preserved   } ].

    `rawData` is a list of dicts with keys:

    - datetime (string; required)

    - laakari (string; required)

    - kesto_min (number; required)

    - tyhja (number; required)

    - bookingProbability (number; optional)

- slotDuration (number; default 5):
    The duration of each slot in minutes.

- startHour (number; default 6):
    The start hour of the day (e.g., 6 for 6:00 AM)."""
    _children_props = []
    _base_nodes = ['children']
    _namespace = 'dash_gantt'
    _type = 'DashGantt'
    @_explicitize_args
    def __init__(self, id=Component.UNDEFINED, rawData=Component.UNDEFINED, date=Component.UNDEFINED, startHour=Component.UNDEFINED, endHour=Component.UNDEFINED, slotDuration=Component.UNDEFINED, backgroundColor=Component.UNDEFINED, onDataChange=Component.UNDEFINED, **kwargs):
        self._prop_names = ['id', 'backgroundColor', 'date', 'endHour', 'rawData', 'slotDuration', 'startHour']
        self._valid_wildcard_attributes =            []
        self.available_properties = ['id', 'backgroundColor', 'date', 'endHour', 'rawData', 'slotDuration', 'startHour']
        self.available_wildcard_properties =            []
        _explicit_args = kwargs.pop('_explicit_args')
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs and excess named props
        args = {k: _locals[k] for k in _explicit_args}

        super(DashGantt, self).__init__(**args)
