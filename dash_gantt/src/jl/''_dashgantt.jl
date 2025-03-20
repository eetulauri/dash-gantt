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
- `rawData` (optional): Raw data from CSV/database in the format:
[
  {
    datetime: string, // Format: "YYYY-MM-DD HH:MM"
    laakari: string, // Doctor name
    kesto_min: number, // Duration in minutes
    tyhja: number, // 0 if booked, 1 if available
    bookingProbability?: number, // Optional, defaults to 0.5 if not provided
    // Additional fields are allowed and will be preserved
  }
]. rawData has the following type: Array of lists containing elements 'datetime', 'laakari', 'kesto_min', 'tyhja', 'bookingProbability'.
Those elements have the following types:
  - `datetime` (String; required)
  - `laakari` (String; required)
  - `kesto_min` (Real; required)
  - `tyhja` (Real; required)
  - `bookingProbability` (Real; optional)s
- `slotDuration` (Real; optional): The duration of each slot in minutes.
- `startHour` (Real; optional): The start hour of the day (e.g., 6 for 6:00 AM).
"""
function ''_dashgantt(; kwargs...)
        available_props = Symbol[:id, :backgroundColor, :date, :endHour, :rawData, :slotDuration, :startHour]
        wild_props = Symbol[]
        return Component("''_dashgantt", "DashGantt", "dash_gantt", available_props, wild_props; kwargs...)
end

