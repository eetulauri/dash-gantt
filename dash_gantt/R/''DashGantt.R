# AUTO GENERATED FILE - DO NOT EDIT

#' @export
''DashGantt <- function(id=NULL, backgroundColor=NULL, date=NULL, endHour=NULL, professionals=NULL, slotDuration=NULL, startHour=NULL, timeslots=NULL) {
    
    props <- list(id=id, backgroundColor=backgroundColor, date=date, endHour=endHour, professionals=professionals, slotDuration=slotDuration, startHour=startHour, timeslots=timeslots)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'DashGantt',
        namespace = 'dash_gantt',
        propNames = c('id', 'backgroundColor', 'date', 'endHour', 'professionals', 'slotDuration', 'startHour', 'timeslots'),
        package = 'dashGantt'
        )

    structure(component, class = c('dash_component', 'list'))
}
