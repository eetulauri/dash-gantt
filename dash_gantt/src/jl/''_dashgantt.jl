# AUTO GENERATED FILE - DO NOT EDIT

export ''_dashgantt

"""
    ''_dashgantt(;kwargs...)

A DashGantt component.
DashGantt is a Gantt chart component for scheduling.
It displays professionals vertically and time horizontally.
Users can add, modify, and remove timeslots for each professional.
The component outputs data that can be used in a prediction model.
Keyword arguments:
- `id` (String; optional): The ID used to identify this component in Dash callbacks.
- `backgroundColor` (String; optional): The background color for the header row.
- `date` (String; optional): The date to display in the Gantt chart (YYYY-MM-DD).
- `endHour` (Real; optional): The end hour of the day (e.g., 24 for midnight).
- `professionals` (required): List of professionals to display in the Gantt chart.
Each professional should have an id and name.. professionals has the following type: Array of lists containing elements 'id', 'name'.
Those elements have the following types:
  - `id` (Real; required)
  - `name` (String; required)s
- `slotDuration` (Real; optional): The duration of each slot in minutes.
- `startHour` (Real; optional): The start hour of the day (e.g., 6 for 6:00 AM).
- `timeslots` (optional): List of timeslots to display in the Gantt chart.
Each timeslot should have an id, professionalId, start time, end time, and date.. timeslots has the following type: Array of lists containing elements 'id', 'professionalId', 'start', 'end', 'date', 'bookingProbability', 'isBooked', 'appointmentType', 'resource'.
Those elements have the following types:
  - `id` (Real; required)
  - `professionalId` (Real; required)
  - `start` (String; required)
  - `end` (String; required)
  - `date` (String; required)
  - `bookingProbability` (Real; optional)
  - `isBooked` (Bool; optional)
  - `appointmentType` (String; optional)
  - `resource` (String; optional)s
"""
function ''_dashgantt(; kwargs...)
        available_props = Symbol[:id, :backgroundColor, :date, :endHour, :professionals, :slotDuration, :startHour, :timeslots]
        wild_props = Symbol[]
        return Component("''_dashgantt", "DashGantt", "dash_gantt", available_props, wild_props; kwargs...)
end

