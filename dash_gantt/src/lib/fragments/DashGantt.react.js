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
            hoveredCell: null,
            // Cache for slot width calculations to avoid repeated calculations
            slotWidthCache: {}
        };
        
        // Bind methods
        this.handleSlotClick = this.handleSlotClick.bind(this);
        this.handleAddSlot = this.handleAddSlot.bind(this);
        this.handleCreateSlot = this.handleCreateSlot.bind(this);
        this.handleRemoveSlot = this.handleRemoveSlot.bind(this);
        this.handleSaveSlot = this.handleSaveSlot.bind(this);
        this.handleCancelEdit = this.handleCancelEdit.bind(this);
        this.handleCellHover = this.handleCellHover.bind(this);
        this.handleCellLeave = this.handleCellLeave.bind(this);
        this.renderSlotRectangle = this.renderSlotRectangle.bind(this);
        this.generateTimeCells = this.generateTimeCells.bind(this);
        this.formatTime = this.formatTime.bind(this);
        this.timeToDecimal = this.timeToDecimal.bind(this);
        this.calculateSlotWidth = this.calculateSlotWidth.bind(this);
        this.getSlotWidth = this.getSlotWidth.bind(this);
    }
    
    // Handle clicking on a timeslot
    handleSlotClick(slot) {
        this.setState({
            selectedSlot: slot,
            isAddingSlot: false
        });
    }
    
    // Handle cell hover
    handleCellHover(professionalId, hour, minute) {
        // Avoid unnecessary state updates if hovering over the same cell
        const currentHover = this.state.hoveredCell;
        if (currentHover && 
            currentHover.professionalId === professionalId && 
            currentHover.hour === hour && 
            currentHover.minute === minute) {
            return; // No change needed
        }
        
        // Update the hover state
        this.setState({
            hoveredCell: { professionalId, hour, minute }
        });
    }
    
    // Handle cell leave
    handleCellLeave() {
        // Only update state if we're currently hovering over a cell
        if (this.state.hoveredCell !== null) {
            this.setState({
                hoveredCell: null
            });
        }
    }
    
    // Handle creating a new timeslot with a single click
    handleCreateSlot(professionalId, hour, minute) {
        const { timeslots, date, setProps } = this.props;
        
        // Calculate start and end times
        const startHour = Math.floor(hour);
        const startMinutes = minute;
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
        
        // Always create a 20-minute slot regardless of slotDuration prop
        const slotDurationMinutes = 20; // Fixed 20-minute duration for created slots
        
        // Calculate end time, ensuring exact 20-minute duration
        // We use integer math to avoid floating-point precision issues
        const totalStartMinutes = (startHour * 60) + startMinutes;
        const totalEndMinutes = totalStartMinutes + slotDurationMinutes;
        const endHour = Math.floor(totalEndMinutes / 60);
        const endMinutes = totalEndMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        
        // Create new slot
        const newId = timeslots.length > 0 ? Math.max(...timeslots.map(slot => slot.id)) + 1 : 1;
        const slotToAdd = {
            id: newId,
            professionalId: professionalId,
            start: startTime,
            end: endTime,
            date: date,
            bookingProbability: 0.5 // Default probability, can be updated later by prediction model
        };
        
        // Update timeslots
        const updatedTimeslots = [...timeslots, slotToAdd];
        setProps({ timeslots: updatedTimeslots });
    }
    
    // Handle adding a new timeslot
    handleAddSlot(professionalId, hour, minute) {
        const { slotDuration } = this.props;
        const startHour = Math.floor(hour);
        const startMinutes = minute;
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
    
    // Calculate the width of a slot that should span multiple cells
    calculateSlotWidth(start, end, slotDuration) {
        // Calculate duration in minutes
        const startDecimal = this.timeToDecimal(start);
        const endDecimal = this.timeToDecimal(end);
        const durationInHours = endDecimal - startDecimal;
        const durationInMinutes = durationInHours * 60;
        
        // Calculate how many grid cells this should span
        // To avoid floating-point precision issues, round to the nearest integer
        // For a 20-minute duration with 5-minute slots, this should consistently give 4 cells
        const numCells = Math.round(durationInMinutes / slotDuration);
        
        // Log the calculation only in development mode to reduce console noise
        if (process.env.NODE_ENV === 'development') {
            console.log(`Slot ${start}-${end}: Duration=${durationInMinutes}min, Spans ${numCells} cells`);
        }
        
        // Return the exact number of cells to span (minimum 1)
        return Math.max(1, numCells);
    }
    
    // Format decimal hours to time string
    decimalToTime(decimal) {
        const hours = Math.floor(decimal);
        const minutes = Math.round((decimal - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Get color based on booking probability using a continuous gradient
    getProbabilityColor(probability) {
        if (probability === undefined) return '#4CAF50'; // Default green
        
        // Clamp probability between 0 and 1 for safety
        const p = Math.max(0, Math.min(1, probability));
        
        // RGB values for red (low probability) to green (high probability)
        // Red component: decreases as probability increases
        const r = Math.round(255 * (1 - p));
        
        // Green component: increases as probability increases
        const g = Math.round(255 * p);
        
        // Blue component: keep low for red-to-green spectrum
        const b = 0;
        
        // Convert to hex color
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Render a single slot rectangle
    renderSlotRectangle(slot) {
        const { slotDuration } = this.props;
        
        // Get the number of cells this slot should span (using cached value if available)
        const numCellsToSpan = this.getSlotWidth(slot, slotDuration);
        
        // We need to make the rectangle fill exactly the grid cells it should span
        // Calculate width to exactly fill the grid cells
        const slotStyle = {
            position: 'absolute',
            top: '4px',
            left: '0',
            height: 'calc(100% - 8px)',
            // For a consistent calculation that accounts for grid lines:
            // - Multiply by 100% to get the percentage width
            // - Add (numCells-1) pixels to account for the internal borders
            width: `calc(${numCellsToSpan * 100}% + ${numCellsToSpan - 1}px)`,
            // Set box-sizing to border-box to include borders in element's dimensions
            boxSizing: 'border-box',
            backgroundColor: this.getProbabilityColor(slot.bookingProbability),
            color: 'white',
            borderRadius: '3px', // Slightly less rounded for cleaner look
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)', // Lighter shadow for simple_white theme
            zIndex: 100,
            transition: 'all 0.15s ease-in-out'
        };
        
        const probabilityStyle = {
            fontSize: '14px',
            fontWeight: '500', // Medium weight for cleaner look
            textShadow: '0 1px 1px rgba(0,0,0,0.2)' // Subtle text shadow for legibility
        };
        
        return (
            <div 
                key={`slot-${slot.id}`} 
                style={slotStyle}
                onClick={(e) => {
                    e.stopPropagation();
                    this.handleSlotClick(slot);
                }}
                title={`Time slot: ${slot.start} - ${slot.end} (Booking probability: ${Math.round(slot.bookingProbability * 100)}%)`}
            >
                {slot.bookingProbability !== undefined && (
                    <div style={probabilityStyle}>
                        {Math.round(slot.bookingProbability * 100)}%
                    </div>
                )}
            </div>
        );
    }
    
    // Format time for display (HH:MM)
    formatTime(hour, minute) {
        return `${Math.floor(hour).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Generate time cells for each hour and minute interval
    generateTimeCells(professional, styles) {
        const { timeslots, startHour, endHour, slotDuration } = this.props;
        const slotsPerHour = 60 / slotDuration;
        const cells = [];
        
        // Only filter slots for this professional once
        const professionalSlots = timeslots.filter(slot => slot.professionalId === professional.id);
        
        // Group slots by their start time for more efficient lookup
        const slotsByStartTime = {};
        professionalSlots.forEach(slot => {
            const [hour, minute] = slot.start.split(':').map(Number);
            const key = `${hour}:${minute}`;
            slotsByStartTime[key] = slot;
        });
        
        // Pre-create styles for hover state to reduce object creation during render
        const hoverStyle = {
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            fontSize: '10px',
            color: '#666',
            pointerEvents: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '1px 3px',
            borderRadius: '2px',
            zIndex: 200
        };
        
        // Iterate through each time slot for this professional
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minuteIndex = 0; minuteIndex < slotsPerHour; minuteIndex++) {
                const minute = minuteIndex * slotDuration;
                const timeKey = `${hour}:${minute}`;
                const displayTimeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                
                // Check if this cell is the start of a time slot
                const slot = slotsByStartTime[timeKey];
                
                const isHovered = this.state.hoveredCell && 
                                this.state.hoveredCell.professionalId === professional.id && 
                                this.state.hoveredCell.hour === hour &&
                                this.state.hoveredCell.minute === minute;
                
                // Format time for display in the hover tooltip
                const timeDisplay = this.formatTime(hour, minute);
                
                // Create a consistent cell style with proper borders
                // Hour borders are thicker for better visual separation
                const cellStyle = {
                    ...styles.dashGanttTimeCell,
                    backgroundColor: isHovered ? '#fafafa' : 'transparent',
                    borderLeft: minute === 0 ? '1px solid #eaeaea' : 'none',  // Only show left border at hour boundaries
                    position: 'relative'
                };
                
                // Create the cell for this time slot
                const cell = (
                    <td 
                        key={`cell-${professional.id}-${displayTimeKey}`} 
                        style={cellStyle}
                        onClick={() => this.handleCreateSlot(professional.id, hour, minute)}
                        onMouseEnter={() => this.handleCellHover(professional.id, hour, minute)}
                        onMouseLeave={this.handleCellLeave}
                        title={`Time: ${timeDisplay}`}
                    >
                        {slot && this.renderSlotRectangle(slot)}
                        
                        {/* Show time on hover */}
                        {isHovered && (
                            <div style={{
                                position: 'absolute', 
                                bottom: '2px', 
                                right: '2px', 
                                fontSize: '10px', 
                                color: '#666', 
                                pointerEvents: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                padding: '1px 3px', 
                                borderRadius: '2px', 
                                zIndex: 200,
                                border: '1px solid #eaeaea'
                            }}>
                                {timeDisplay}
                            </div>
                        )}
                    </td>
                );
                
                cells.push(cell);
            }
        }
        
        return cells;
    }
    
    // Get cached slot width or calculate it if not in cache
    getSlotWidth(slot, slotDuration) {
        // Create a unique key for this slot and duration
        const cacheKey = `${slot.id}_${slot.start}_${slot.end}_${slotDuration}`;
        
        // If we have a cached value, use it
        if (this.state.slotWidthCache[cacheKey] !== undefined) {
            return this.state.slotWidthCache[cacheKey];
        }
        
        // Otherwise, calculate and cache the value
        const width = this.calculateSlotWidth(slot.start, slot.end, slotDuration);
        
        // Update the cache (without triggering a re-render)
        // We can safely update state directly here since we're not using setState
        // and this won't trigger a re-render - it's just for caching
        this.state.slotWidthCache[cacheKey] = width;
        
        return width;
    }
    
    // Optimize rendering by preventing unnecessary re-renders
    shouldComponentUpdate(nextProps, nextState) {
        // We need to allow hover state changes to trigger re-renders for hover effects
        // but we can still optimize by not recalculating slot widths
        
        // For any state or prop changes, we should re-render
        // But we can optimize calculations inside the render cycle
        return true;
    }
    
    // Reset cache when props change
    componentDidUpdate(prevProps) {
        // If timeslots change, clear the width cache to ensure correct calculations
        if (prevProps.timeslots !== this.props.timeslots || 
            prevProps.slotDuration !== this.props.slotDuration) {
            this.setState({
                slotWidthCache: {}
            });
        }
    }
    
    render() {
        const { id, professionals, date, timeslots, startHour, endHour, slotDuration } = this.props;
        
        // Calculate number of time slots per hour (e.g., 3 for 20-minute slots)
        const slotsPerHour = 60 / slotDuration;
        
        // Calculate total number of slots in the timeline
        const totalSlots = (endHour - startHour) * slotsPerHour;
        
        const styles = {
            dashGantt: {
                fontFamily: 'Arial, sans-serif',
                margin: '20px 0'
            },
            dashGanttHeader: {
                marginBottom: '10px'
            },
            dashGanttContainer: {
                border: '1px solid #e0e0e0', // Even lighter border for simple_white theme
                borderRadius: '4px', // Less rounded corners for clean look
                overflow: 'hidden',
                overflowX: 'auto',
                boxShadow: 'none' // No shadow for minimalist look
            },
            dashGanttTable: {
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed'
            },
            dashGanttHeaderRow: {
                backgroundColor: this.props.backgroundColor || '#ffffff' // White background like simple_white theme
            },
            dashGanttHeaderCell: {
                padding: '12px 8px', 
                textAlign: 'center',
                fontWeight: '500', // Medium weight for cleaner look
                borderRight: '1px solid #eaeaea', // Very light border
                borderBottom: '1px solid #eaeaea',
                fontSize: '14px',
                color: '#444' // Darker text for better readability
            },
            dashGanttFirstHeaderCell: {
                width: '150px',
                borderRight: '1px solid #eaeaea',
                borderBottom: '1px solid #eaeaea'
            },
            dashGanttRow: {
                height: '60px'
            },
            dashGanttProfessionalCell: {
                width: '150px',
                padding: '8px',
                borderRight: '1px solid #eaeaea',
                borderBottom: '1px solid #eaeaea',
                backgroundColor: this.props.backgroundColor || '#ffffff', // Use same background color as headers
                verticalAlign: 'middle',
                fontWeight: '500',
                fontSize: '14px',
                color: '#444'
            },
            dashGanttTimeCell: {
                position: 'relative',
                padding: '0',
                borderRight: '1px solid #f5f5f5', // Very subtle grid lines
                borderBottom: '1px solid #eaeaea',
                cursor: 'pointer',
                height: '60px',
                width: `${100 / totalSlots}%`,
                boxSizing: 'border-box',
                transition: 'background-color 0.2s ease'
            },
            dashGanttSlot: {
                position: 'absolute',
                top: '0',
                height: '100%',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', // Lighter shadow for cleaner look
                zIndex: 10,
                overflow: 'hidden'
            },
            dashGanttProbability: {
                fontSize: '14px',
                fontWeight: '500'
            },
            dashGanttEditor: {
                marginTop: '20px',
                padding: '15px',
                border: '1px solid #eaeaea', // Lighter border for simple_white
                borderRadius: '4px',
                backgroundColor: '#ffffff' // Pure white background
            },
            dashGanttForm: {
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            },
            dashGanttFormGroup: {
                display: 'flex',
                alignItems: 'center'
            },
            dashGanttFormGroupLabel: {
                width: '100px',
                marginRight: '10px',
                color: '#444',
                fontSize: '14px'
            },
            dashGanttFormGroupInput: {
                flex: 1,
                padding: '8px',
                border: '1px solid #eaeaea',
                borderRadius: '4px',
                fontSize: '14px'
            },
            dashGanttFormActions: {
                display: 'flex',
                gap: '10px',
                marginTop: '10px'
            },
            dashGanttFormActionsButton: {
                padding: '8px 15px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
            },
            dashGanttFormActionsSave: {
                backgroundColor: '#2196F3', // Using blue for primary action
                color: 'white'
            },
            dashGanttFormActionsCancel: {
                backgroundColor: '#f5f5f5',
                color: '#333'
            },
            dashGanttFormActionsRemove: {
                backgroundColor: '#f44336',
                color: 'white'
            }
        };
        
        // Generate hour labels
        const hourLabels = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            const displayHour = hour % 24; // Handle 24-hour format
            const isPM = displayHour >= 12;
            const display12Hour = displayHour === 0 ? 12 : (displayHour > 12 ? displayHour - 12 : displayHour);
            const timeLabel = `${display12Hour}${isPM ? 'PM' : 'AM'}`;
            hourLabels.push(timeLabel);
        }
        
        // Generate hour header cells
        const generateHourHeaderCells = () => {
            const cells = [];
            
            for (let hour = startHour; hour <= endHour; hour++) {
                // Use 24-hour format (European style)
                // Ensure we're not exceeding 24 hours (handle edge case for endHour=24)
                const displayHour = hour === 24 ? 24 : hour % 24;
                // Format as 2-digit hour (e.g., "06" instead of "6")
                const timeLabel = `${displayHour.toString().padStart(2, '0')}:00`;
                
                cells.push(
                    <th 
                        key={`header-${hour}`} 
                        colSpan={slotsPerHour}
                        style={styles.dashGanttHeaderCell}
                    >
                        {timeLabel}
                    </th>
                );
            }
            
            return cells;
        };

        return (
            <div id={id} style={styles.dashGantt}>
                <div style={styles.dashGanttHeader}>
                    <h2>Schedule for {date}</h2>
                </div>
                <div style={styles.dashGanttContainer}>
                    <table style={styles.dashGanttTable}>
                        <thead>
                            <tr style={styles.dashGanttHeaderRow}>
                                <th style={styles.dashGanttFirstHeaderCell}></th>
                                {generateHourHeaderCells()}
                            </tr>
                        </thead>
                        <tbody>
                            {professionals.map(professional => (
                                <tr key={`row-${professional.id}`} style={styles.dashGanttRow}>
                                    <td style={styles.dashGanttProfessionalCell}>
                                        {professional.name}
                                    </td>
                                    {this.generateTimeCells(professional, styles)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Render slot editor */}
                {this.state.selectedSlot || this.state.isAddingSlot ? (
                    <div style={styles.dashGanttEditor}>
                        <h3>{this.state.isAddingSlot ? 'Add New Slot' : 'Edit Slot'}</h3>
                        <div style={styles.dashGanttForm}>
                            <div style={styles.dashGanttFormGroup}>
                                <label style={styles.dashGanttFormGroupLabel}>Professional:</label>
                                <select 
                                    style={styles.dashGanttFormGroupInput}
                                    value={this.state.isAddingSlot ? this.state.newSlot.professionalId : this.state.selectedSlot.professionalId} 
                                    onChange={e => {
                                        const professionalId = parseInt(e.target.value);
                                        if (this.state.isAddingSlot) {
                                            this.setState({ newSlot: { ...this.state.newSlot, professionalId } });
                                        } else {
                                            this.setState({ selectedSlot: { ...this.state.selectedSlot, professionalId } });
                                        }
                                    }}
                                    disabled={!this.state.isAddingSlot}
                                >
                                    {professionals.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.dashGanttFormGroup}>
                                <label style={styles.dashGanttFormGroupLabel}>Start Time:</label>
                                <input 
                                    type="time" 
                                    style={styles.dashGanttFormGroupInput}
                                    value={this.state.isAddingSlot ? this.state.newSlot.start : this.state.selectedSlot.start} 
                                    onChange={e => {
                                        const start = e.target.value;
                                        if (this.state.isAddingSlot) {
                                            this.setState({ newSlot: { ...this.state.newSlot, start } });
                                        } else {
                                            this.setState({ selectedSlot: { ...this.state.selectedSlot, start } });
                                        }
                                    }}
                                />
                            </div>
                            <div style={styles.dashGanttFormGroup}>
                                <label style={styles.dashGanttFormGroupLabel}>End Time:</label>
                                <input 
                                    type="time" 
                                    style={styles.dashGanttFormGroupInput}
                                    value={this.state.isAddingSlot ? this.state.newSlot.end : this.state.selectedSlot.end} 
                                    onChange={e => {
                                        const end = e.target.value;
                                        if (this.state.isAddingSlot) {
                                            this.setState({ newSlot: { ...this.state.newSlot, end } });
                                        } else {
                                            this.setState({ selectedSlot: { ...this.state.selectedSlot, end } });
                                        }
                                    }}
                                />
                            </div>
                            <div style={styles.dashGanttFormActions}>
                                <button 
                                    style={{...styles.dashGanttFormActionsButton, ...styles.dashGanttFormActionsSave}}
                                    onClick={this.handleSaveSlot}
                                >
                                    Save
                                </button>
                                <button 
                                    style={{...styles.dashGanttFormActionsButton, ...styles.dashGanttFormActionsCancel}}
                                    onClick={this.handleCancelEdit}
                                >
                                    Cancel
                                </button>
                                {!this.state.isAddingSlot && (
                                    <button 
                                        style={{...styles.dashGanttFormActionsButton, ...styles.dashGanttFormActionsRemove}}
                                        onClick={() => this.handleRemoveSlot(this.state.selectedSlot.id)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}

DashGantt.defaultProps = {
    timeslots: [],
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startHour: 6, // 6:00 AM
    endHour: 24, // Midnight
    slotDuration: 20, // 20 minutes
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
