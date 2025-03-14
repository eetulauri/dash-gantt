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

- date (string; default new Date().toISOString().split('T')[0]):
    The date to display in the Gantt chart (YYYY-MM-DD).

- endHour (number; default 24):
    The end hour of the day (e.g., 24 for midnight).

- professionals (list of dicts; required):
    List of professionals to display in the Gantt chart. Each
    professional should have an id and name.

    `professionals` is a list of dicts with keys:

    - id (number; required)

    - name (string; required)

- slotDuration (number; default 20):
    The duration of each slot in minutes.

- startHour (number; default 6):
    The start hour of the day (e.g., 6 for 6:00 AM).

- timeslots (list of dicts; optional):
    List of timeslots to display in the Gantt chart. Each timeslot
    should have an id, professionalId, start time, end time, and date.

    `timeslots` is a list of dicts with keys:

    - id (number; required)

    - professionalId (number; required)

    - start (string; required)

    - end (string; required)

    - date (string; required)

    - bookingProbability (number; optional)"""
    _children_props = []
    _base_nodes = ['children']
    _namespace = 'dash_gantt'
    _type = 'DashGantt'
    @_explicitize_args
    def __init__(self, id=Component.UNDEFINED, professionals=Component.REQUIRED, timeslots=Component.UNDEFINED, date=Component.UNDEFINED, startHour=Component.UNDEFINED, endHour=Component.UNDEFINED, slotDuration=Component.UNDEFINED, **kwargs):
        self._prop_names = ['id', 'date', 'endHour', 'professionals', 'slotDuration', 'startHour', 'timeslots']
        self._valid_wildcard_attributes =            []
        self.available_properties = ['id', 'date', 'endHour', 'professionals', 'slotDuration', 'startHour', 'timeslots']
        self.available_wildcard_properties =            []
        _explicit_args = kwargs.pop('_explicit_args')
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs and excess named props
        args = {k: _locals[k] for k in _explicit_args}

        for k in ['professionals']:
            if k not in args:
                raise TypeError(
                    'Required argument `' + k + '` was not specified.')

        super(DashGantt, self).__init__(**args)
