# AUTO GENERATED FILE - DO NOT EDIT

#' @export
''DashGantt <- function(id=NULL, backgroundColor=NULL, date=NULL, endHour=NULL, onDataChange=NULL, rawData=NULL, slotDuration=NULL, startHour=NULL) {
    
    props <- list(id=id, backgroundColor=backgroundColor, date=date, endHour=endHour, onDataChange=onDataChange, rawData=rawData, slotDuration=slotDuration, startHour=startHour)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'DashGantt',
        namespace = 'dash_gantt',
        propNames = c('id', 'backgroundColor', 'date', 'endHour', 'onDataChange', 'rawData', 'slotDuration', 'startHour'),
        package = 'dashGantt'
        )

    structure(component, class = c('dash_component', 'list'))
}
