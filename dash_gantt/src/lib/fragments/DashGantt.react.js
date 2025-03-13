import React, {Component} from 'react';
import PropTypes from 'prop-types';

/**
 * DashGantt is a Gantt chart component for scheduling.
 * It displays professionals vertically and time horizontally.
 * Users can add, modify, and remove timeslots for each professional.
 * The component outputs data that can be used in a prediction model.
 */
export default class DashGantt extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            selectedSlot: null,
            isAddingSlot: false,
            newSlot: {
                professionalId: null,
                start: null,
                end: null
            },
            hoveredCell: null
        };
        
        // Bind methods
        this.handleSlotClick = this.handleSlotClick.bind(this);
        this.handleAddSlot = this.handleAddSlot.bind(this);
        this.handleRemoveSlot = this.handleRemoveSlot.bind(this);
        this.handleSaveSlot = this.handleSaveSlot.bind(this);
        this.handleCancelEdit = this.handleCancelEdit.bind(this);
        this.handleCellHover = this.handleCellHover.bind(this);
        this.handleCellLeave = this.handleCellLeave.bind(this);
    }
    
    // Handle clicking on a timeslot
    handleSlotClick(slot) {
        this.setState({
            selectedSlot: slot,
            isAddingSlot: false
        });
    }
    
    // Handle cell hover
    handleCellHover(professionalId, hour) {
        this.setState({
            hoveredCell: { professionalId, hour }
        });
    }
    
    // Handle cell leave
    handleCellLeave() {
        this.setState({
            hoveredCell: null
        });
    }
    
    // Handle adding a new timeslot
    handleAddSlot(professionalId, hour) {
        const { slotDuration } = this.props;
        const startHour = Math.floor(hour);
        const startMinutes = (hour - startHour) * 60;
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
        
        const endTimeInMinutes = startHour * 60 + startMinutes + slotDuration;
        const endHour = Math.floor(endTimeInMinutes / 60);
        const endMinutes = endTimeInMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        
        this.setState({
            isAddingSlot: true,
            selectedSlot: null,
            newSlot: {
                professionalId,
                start: startTime,
                end: endTime
            }
        });
    }
    
    // Handle removing a timeslot
    handleRemoveSlot(slotId) {
        const { timeslots, setProps } = this.props;
        const updatedTimeslots = timeslots.filter(slot => slot.id !== slotId);
        
        setProps({ timeslots: updatedTimeslots });
        this.setState({ selectedSlot: null });
    }
    
    // Handle saving a timeslot (new or edited)
    handleSaveSlot() {
        const { timeslots, date, setProps } = this.props;
        const { selectedSlot, newSlot, isAddingSlot } = this.state;
        
        let updatedTimeslots;
        
        if (isAddingSlot) {
            // Add new slot
            const newId = timeslots.length > 0 ? Math.max(...timeslots.map(slot => slot.id)) + 1 : 1;
            const slotToAdd = {
                id: newId,
                professionalId: newSlot.professionalId,
                start: newSlot.start,
                end: newSlot.end,
                date: date
            };
            
            updatedTimeslots = [...timeslots, slotToAdd];
        } else {
            // Update existing slot
            updatedTimeslots = timeslots.map(slot => 
                slot.id === selectedSlot.id ? { ...slot, ...selectedSlot } : slot
            );
        }
        
        setProps({ timeslots: updatedTimeslots });
        this.setState({
            selectedSlot: null,
            isAddingSlot: false,
            newSlot: {
                professionalId: null,
                start: null,
                end: null
            }
        });
    }
    
    // Handle canceling edit or add operation
    handleCancelEdit() {
        this.setState({
            selectedSlot: null,
            isAddingSlot: false,
            newSlot: {
                professionalId: null,
                start: null,
                end: null
            }
        });
    }
    
    // Convert time string to decimal hours
    timeToDecimal(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes / 60);
    }
    
    // Format decimal hours to time string
    decimalToTime(decimal) {
        const hours = Math.floor(decimal);
        const minutes = Math.round((decimal - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Calculate position and width for a timeslot
    calculateSlotStyle(slot, startHour, endHour) {
        const slotStart = this.timeToDecimal(slot.start);
        const slotEnd = this.timeToDecimal(slot.end);
        
        // Calculate position as percentage of the total width
        const totalHours = endHour - startHour;
        const left = ((slotStart - startHour) / totalHours) * 100;
        const width = ((slotEnd - slotStart) / totalHours) * 100;
        
        return {
            left: `${left}%`,
            width: `${width}%`
        };
    }
    
    // Get color based on booking probability
    getProbabilityColor(probability) {
        if (probability === undefined) return '#4CAF50'; // Default green
        
        if (probability >= 0.7) return '#4CAF50'; // Green for high probability
        if (probability >= 0.4) return '#FFC107'; // Yellow for medium probability
        return '#F44336'; // Red for low probability
    }
    
    // Render time header (hours)
    renderTimeHeader() {
        const { startHour, endHour } = this.props;
        const hours = [];
        
        // Create hour markers for the time header
        for (let hour = startHour; hour <= endHour; hour++) {
            const displayHour = hour % 24; // Handle 24-hour format
            const isPM = displayHour >= 12;
            const display12Hour = displayHour === 0 ? 12 : (displayHour > 12 ? displayHour - 12 : displayHour);
            const timeLabel = `${display12Hour}${isPM ? 'PM' : 'AM'}`;
            
            hours.push(
                <div key={`hour-${hour}`} className="dash-gantt-hour">
                    {timeLabel}
                </div>
            );
        }
        
        return (
            <div className="dash-gantt-time-header">
                <div className="dash-gantt-empty-cell"></div>
                <div className="dash-gantt-hours">
                    {hours}
                </div>
            </div>
        );
    }
    
    // Render a professional row
    renderProfessionalRow(professional) {
        const { startHour, endHour, timeslots } = this.props;
        const { hoveredCell } = this.state;
        const professionalSlots = timeslots.filter(slot => slot.professionalId === professional.id);
        
        return (
            <div key={`row-${professional.id}`} className="dash-gantt-row">
                <div className="dash-gantt-professional">
                    {professional.name}
                </div>
                <div className="dash-gantt-timeline">
                    {/* Render grid lines for each hour */}
                    {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
                        <div 
                            key={`grid-${i}`} 
                            className="dash-gantt-grid-line"
                            onClick={() => this.handleAddSlot(professional.id, startHour + i)}
                            onMouseEnter={() => this.handleCellHover(professional.id, startHour + i)}
                            onMouseLeave={this.handleCellLeave}
                            style={{
                                backgroundColor: hoveredCell && 
                                                hoveredCell.professionalId === professional.id && 
                                                hoveredCell.hour === startHour + i ? 
                                                '#f0f0f0' : 'transparent'
                            }}
                        />
                    ))}
                    
                    {/* Render timeslots */}
                    {professionalSlots.map(slot => {
                        const slotStyle = this.calculateSlotStyle(slot, startHour, endHour);
                        const backgroundColor = this.getProbabilityColor(slot.bookingProbability);
                        
                        return (
                            <div 
                                key={`slot-${slot.id}`} 
                                className="dash-gantt-slot"
                                style={{
                                    ...slotStyle,
                                    backgroundColor
                                }}
                                onClick={() => this.handleSlotClick(slot)}
                            >
                                <div className="dash-gantt-slot-time">
                                    {slot.start} - {slot.end}
                                </div>
                                {slot.bookingProbability !== undefined && (
                                    <div className="dash-gantt-probability">
                                        {Math.round(slot.bookingProbability * 100)}%
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    // Render the slot editor
    renderSlotEditor() {
        const { professionals } = this.props;
        const { selectedSlot, isAddingSlot, newSlot } = this.state;
        
        const slot = isAddingSlot ? newSlot : selectedSlot;
        
        if (!slot) return null;
        
        return (
            <div className="dash-gantt-editor">
                <h3>{isAddingSlot ? 'Add New Slot' : 'Edit Slot'}</h3>
                <div className="dash-gantt-form">
                    <div className="dash-gantt-form-group">
                        <label>Professional:</label>
                        <select 
                            value={slot.professionalId} 
                            onChange={e => {
                                const updatedSlot = { ...slot, professionalId: parseInt(e.target.value) };
                                if (isAddingSlot) {
                                    this.setState({ newSlot: updatedSlot });
                                } else {
                                    this.setState({ selectedSlot: updatedSlot });
                                }
                            }}
                            disabled={!isAddingSlot}
                        >
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="dash-gantt-form-group">
                        <label>Start Time:</label>
                        <input 
                            type="time" 
                            value={slot.start} 
                            onChange={e => {
                                const updatedSlot = { ...slot, start: e.target.value };
                                if (isAddingSlot) {
                                    this.setState({ newSlot: updatedSlot });
                                } else {
                                    this.setState({ selectedSlot: updatedSlot });
                                }
                            }}
                        />
                    </div>
                    <div className="dash-gantt-form-group">
                        <label>End Time:</label>
                        <input 
                            type="time" 
                            value={slot.end} 
                            onChange={e => {
                                const updatedSlot = { ...slot, end: e.target.value };
                                if (isAddingSlot) {
                                    this.setState({ newSlot: updatedSlot });
                                } else {
                                    this.setState({ selectedSlot: updatedSlot });
                                }
                            }}
                        />
                    </div>
                    <div className="dash-gantt-form-actions">
                        <button onClick={this.handleSaveSlot}>Save</button>
                        <button onClick={this.handleCancelEdit}>Cancel</button>
                        {!isAddingSlot && (
                            <button onClick={() => this.handleRemoveSlot(selectedSlot.id)}>Remove</button>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    render() {
        const { id, professionals, date } = this.props;
        
        return (
            <div id={id} className="dash-gantt">
                <div className="dash-gantt-header">
                    <h2>Schedule for {date}</h2>
                </div>
                <div className="dash-gantt-container">
                    {this.renderTimeHeader()}
                    <div className="dash-gantt-body">
                        {professionals.map(professional => this.renderProfessionalRow(professional))}
                    </div>
                </div>
                {this.renderSlotEditor()}
                <style jsx>{`
                    .dash-gantt {
                        font-family: Arial, sans-serif;
                        margin: 20px 0;
                    }
                    .dash-gantt-header {
                        margin-bottom: 10px;
                    }
                    .dash-gantt-container {
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    .dash-gantt-time-header {
                        display: flex;
                        border-bottom: 1px solid #ccc;
                        background-color: #f5f5f5;
                    }
                    .dash-gantt-empty-cell {
                        width: 150px;
                        border-right: 1px solid #ccc;
                    }
                    .dash-gantt-hours {
                        display: flex;
                        flex: 1;
                    }
                    .dash-gantt-hour {
                        flex: 1;
                        padding: 8px;
                        text-align: center;
                        font-weight: bold;
                        border-right: 1px solid #ccc;
                    }
                    .dash-gantt-row {
                        display: flex;
                        border-bottom: 1px solid #ccc;
                        height: 60px;
                    }
                    .dash-gantt-professional {
                        width: 150px;
                        padding: 8px;
                        border-right: 1px solid #ccc;
                        background-color: #f9f9f9;
                        display: flex;
                        align-items: center;
                    }
                    .dash-gantt-timeline {
                        flex: 1;
                        position: relative;
                        display: flex;
                    }
                    .dash-gantt-grid-line {
                        flex: 1;
                        height: 100%;
                        border-right: 1px solid #eee;
                        cursor: pointer;
                    }
                    .dash-gantt-grid-line:hover {
                        background-color: #f0f0f0;
                    }
                    .dash-gantt-slot {
                        position: absolute;
                        top: 5px;
                        height: calc(100% - 10px);
                        background-color: #4CAF50;
                        color: white;
                        border-radius: 4px;
                        padding: 5px;
                        font-size: 12px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        cursor: pointer;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        z-index: 10;
                    }
                    .dash-gantt-slot:hover {
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    .dash-gantt-slot-time {
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .dash-gantt-probability {
                        font-size: 10px;
                        font-weight: bold;
                    }
                    .dash-gantt-editor {
                        margin-top: 20px;
                        padding: 15px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        background-color: #f9f9f9;
                    }
                    .dash-gantt-form {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .dash-gantt-form-group {
                        display: flex;
                        align-items: center;
                    }
                    .dash-gantt-form-group label {
                        width: 100px;
                        margin-right: 10px;
                    }
                    .dash-gantt-form-group input,
                    .dash-gantt-form-group select {
                        flex: 1;
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }
                    .dash-gantt-form-actions {
                        display: flex;
                        gap: 10px;
                        margin-top: 10px;
                    }
                    .dash-gantt-form-actions button {
                        padding: 8px 15px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .dash-gantt-form-actions button:first-child {
                        background-color: #4CAF50;
                        color: white;
                    }
                    .dash-gantt-form-actions button:nth-child(2) {
                        background-color: #f5f5f5;
                    }
                    .dash-gantt-form-actions button:last-child {
                        background-color: #f44336;
                        color: white;
                    }
                `}</style>
            </div>
        );
    }
}

DashGantt.defaultProps = {
    timeslots: [],
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startHour: 6, // 6:00 AM
    endHour: 24, // Midnight
    slotDuration: 60, // 60 minutes
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
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func
};
