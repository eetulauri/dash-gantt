% Auto-generated: do not edit by hand
\name{''DashGantt}

\alias{''DashGantt}

\title{DashGantt component}

\description{
DashGantt is a Gantt chart component for scheduling. It displays professionals vertically and time horizontally. Users can add, modify, and remove timeslots for each professional. The component outputs data that can be used in a prediction model.
}

\usage{
''DashGantt(id=NULL, backgroundColor=NULL, date=NULL, endHour=NULL,
onDataChange=NULL, rawData=NULL, slotDuration=NULL,
startHour=NULL)
}

\arguments{
\item{id}{Character. The ID used to identify this component in Dash callbacks.}

\item{backgroundColor}{Character. The background color for the header row.}

\item{date}{Character. The date to display in the Gantt chart (YYYY-MM-DD).}

\item{endHour}{Numeric. The end hour of the day (e.g., 24 for midnight).}

\item{onDataChange}{Callback function that will be called when the data changes.
The function will receive the updated raw data as its argument.}

\item{rawData}{List of lists containing elements 'datetime', 'laakari', 'kesto_min', 'tyhja', 'bookingprobability'.
those elements have the following types:
  - datetime (character; required)
  - laakari (character; required)
  - kesto_min (numeric; required)
  - tyhja (numeric; required)
  - bookingprobability (numeric; optional)s. Raw data from CSV/database in the format:
[
  {
    datetime: string, // Format: "YYYY-MM-DD HH:MM"
    laakari: string, // Doctor name
    kesto_min: number, // Duration in minutes
    tyhja: number, // 0 if booked, 1 if available
    bookingProbability?: number, // Optional, defaults to 0.5 if not provided
    // Additional fields are allowed and will be preserved
  }
]}

\item{slotDuration}{Numeric. The duration of each slot in minutes.}

\item{startHour}{Numeric. The start hour of the day (e.g., 6 for 6:00 AM).}
}

\value{named list of JSON elements corresponding to React.js properties and their values}

