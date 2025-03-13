% Auto-generated: do not edit by hand
\name{''DashGantt}

\alias{''DashGantt}

\title{DashGantt component}

\description{
DashGantt is a Gantt chart component for scheduling. It displays professionals vertically and time horizontally. Users can add, modify, and remove timeslots for each professional. The component outputs data that can be used in a prediction model.
}

\usage{
''DashGantt(id=NULL, date=NULL, endHour=NULL, professionals=NULL,
slotDuration=NULL, startHour=NULL, timeslots=NULL)
}

\arguments{
\item{id}{Character. The ID used to identify this component in Dash callbacks.}

\item{date}{Character. The date to display in the Gantt chart (YYYY-MM-DD).}

\item{endHour}{Numeric. The end hour of the day (e.g., 24 for midnight).}

\item{professionals}{List of lists containing elements 'id', 'name'.
those elements have the following types:
  - id (numeric; required)
  - name (character; required)s. List of professionals to display in the Gantt chart.
Each professional should have an id and name.}

\item{slotDuration}{Numeric. The duration of each slot in minutes.}

\item{startHour}{Numeric. The start hour of the day (e.g., 6 for 6:00 AM).}

\item{timeslots}{List of lists containing elements 'id', 'professionalid', 'start', 'end', 'date', 'bookingprobability'.
those elements have the following types:
  - id (numeric; required)
  - professionalid (numeric; required)
  - start (character; required)
  - end (character; required)
  - date (character; required)
  - bookingprobability (numeric; optional)s. List of timeslots to display in the Gantt chart.
Each timeslot should have an id, professionalId, start time, end time, and date.}
}

\value{named list of JSON elements corresponding to React.js properties and their values}

