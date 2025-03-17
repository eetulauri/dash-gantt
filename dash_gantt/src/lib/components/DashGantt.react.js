import React from 'react';
import PropTypes from 'prop-types';
import { DashGantt as RealComponent } from '../LazyLoader';

/**
 * DashGantt is a Gantt chart component for scheduling.
 * It displays professionals vertically and time horizontally.
 * Users can add, modify, and remove timeslots for each professional.
 * The component outputs data that can be used in a prediction model.
 */
const DashGantt = (props) => {
    return (
        <React.Suspense fallback={null}>
            <RealComponent {...props}/>
        </React.Suspense>
    );
};

DashGantt.defaultProps = {
    timeslots: [],
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startHour: 6, // 6:00 AM
    endHour: 24, // Midnight
    slotDuration: 20, // 20 minutes as per business requirements
    backgroundColor: '#f5f5f5' // Default background color
};

DashGantt.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string,

    /**
     * List of professionals to display in the Gantt chart.
     * Each professional should have an id and name.
     */
    professionals: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired
        })
    ).isRequired,

    /**
     * List of timeslots to display in the Gantt chart.
     * Each timeslot should have an id, professionalId, start time, end time, and date.
     */
    timeslots: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            professionalId: PropTypes.number.isRequired,
            start: PropTypes.string.isRequired, // Format: "HH:MM"
            end: PropTypes.string.isRequired, // Format: "HH:MM"
            date: PropTypes.string.isRequired, // Format: "YYYY-MM-DD"
            bookingProbability: PropTypes.number // Optional: probability of booking (0-1)
        })
    ),

    /**
     * The date to display in the Gantt chart (YYYY-MM-DD).
     */
    date: PropTypes.string,

    /**
     * The start hour of the day (e.g., 6 for 6:00 AM).
     */
    startHour: PropTypes.number,

    /**
     * The end hour of the day (e.g., 24 for midnight).
     */
    endHour: PropTypes.number,

    /**
     * The duration of each slot in minutes.
     */
    slotDuration: PropTypes.number,

    /**
     * The background color for the header row.
     */
    backgroundColor: PropTypes.string,

    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func
};

export default DashGantt;

export const defaultProps = DashGantt.defaultProps;
export const propTypes = DashGantt.propTypes;
