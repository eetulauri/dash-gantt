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
    rawData: [], // Raw data from CSV/database
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startHour: 6, // 6:00 AM
    endHour: 24, // Midnight
    slotDuration: 5, // 5 minutes as per business requirements
    backgroundColor: '#f5f5f5', // Default background color
    onDataChange: null // Callback for when data changes
};

DashGantt.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string,

    /**
     * Raw data from CSV/database in the format:
     * [
     *   {
     *     datetime: string, // Format: "YYYY-MM-DD HH:MM"
     *     laakari: string, // Doctor name
     *     kesto_min: number, // Duration in minutes
     *     tyhja: number, // 0 if booked, 1 if available
     *     bookingProbability?: number, // Optional, defaults to 0.5 if not provided
     *     // Additional fields are allowed and will be preserved
     *   }
     * ]
     */
    rawData: PropTypes.arrayOf(
        PropTypes.shape({
            datetime: PropTypes.string.isRequired,
            laakari: PropTypes.string.isRequired,
            kesto_min: PropTypes.number.isRequired,
            tyhja: PropTypes.number.isRequired,
            bookingProbability: PropTypes.number
        }).isRequired
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
     * Callback function that will be called when the data changes.
     * The function will receive the updated raw data as its argument.
     */
    onDataChange: PropTypes.func,

    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func
};

export default DashGantt;

export const defaultProps = DashGantt.defaultProps;
export const propTypes = DashGantt.propTypes;
