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
        
        // Add table ref
        this.tableRef = React.createRef();
        
        // Initialize state with props
        const { rawData, date } = props;
        const { professionals, timeslots } = DashGantt.transformData(rawData || [], date || new Date().toISOString().split('T')[0]);
        
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
            slotWidthCache: {},
            // Internal state for transformed data
            professionals: professionals || [],
            timeslots: timeslots || [],
            rawData: rawData || [],
            date: date || new Date().toISOString().split('T')[0],
            isDragging: false,
            dragSide: null, // 'start' or 'end'
            draggedSlot: null,
            originalSlot: null,
            dragPreview: null, // Will show preview of where slot will end up
            dragType: null, // 'move', 'start', or 'end'
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
        this.updateRawData = this.updateRawData.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
    }
    
    // Transform raw data into component format
    static transformData(rawData, date) {
        if (!rawData || !date) return { professionals: [], timeslots: [] };

        // Filter data for the specific date
        const filteredData = rawData.filter(row => {
            const rowDate = row.datetime.split(' ')[0];
            return rowDate === date;
        });

        // Create professionals list from unique doctors
        const professionals = Array.from(new Set(filteredData.map(row => row.laakari)))
            .map((doctor, idx) => ({ id: idx + 1, name: doctor }));

        // Create doctor to id mapping
        const doctorToId = Object.fromEntries(
            professionals.map((p, idx) => [p.name, idx + 1])
        );

        // Transform timeslots
        const timeslots = filteredData.map((row, idx) => {
            const [date, time] = row.datetime.split(' ');
            const startTime = time;
            
            // Calculate end time based on duration
            const [hours, minutes] = time.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0);
            // Use kesto_min directly from the data
            const durationMinutes = row.kesto_min || 0;
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

            return {
                id: idx + 1,
                professionalId: doctorToId[row.laakari],
                start: startTime,
                end: endTime,
                date: date,
                durationMinutes: durationMinutes, // Store the original duration
                bookingProbability: row.bookingProbability || 0.5,
                isBooked: row.tyhja === 0,
                rawData: row // Keep reference to original data with all fields
            };
        });

        return { professionals, timeslots };
    }
    
    // Update getDerivedStateFromProps to handle undefined values
    static getDerivedStateFromProps(nextProps, prevState) {
        if (!nextProps) return null;
        
        const { rawData, date } = nextProps;
        if (rawData !== prevState.rawData || date !== prevState.date) {
            const { professionals, timeslots } = DashGantt.transformData(rawData || [], date || prevState.date);
            return { 
                professionals: professionals || [], 
                timeslots: timeslots || [], 
                rawData: rawData || [], 
                date: date || prevState.date 
            };
        }
        return null;
    }

    // Update componentDidMount to handle undefined values
    componentDidMount() {
        const { rawData, date } = this.props;
        const { professionals, timeslots } = DashGantt.transformData(rawData || [], date || this.state.date);
        this.setState({ 
            professionals: professionals || [], 
            timeslots: timeslots || [],
            rawData: rawData || [],
            date: date || this.state.date
        });
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
        const { timeslots, date } = this.state;
        
        // Calculate start and end times
        const startHour = Math.floor(hour);
        const startMinutes = minute;
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
        
        // Always create a 20-minute slot as per business requirements
        const slotDurationMinutes = 20;
        
        // Calculate end time
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
            bookingProbability: 0.5,
            isBooked: false,
            appointmentType: 'In-person appointment',
            resource: 'Default',
            rawData: null // New slot has no original data
        };
        
        // Update timeslots and raw data
        const updatedTimeslots = [...timeslots, slotToAdd];
        this.setState({ timeslots: updatedTimeslots });
        this.updateRawData(updatedTimeslots);
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
        const { timeslots } = this.state;
        const updatedTimeslots = timeslots.filter(slot => slot.id !== slotId);
        this.setState({ 
            timeslots: updatedTimeslots,
            selectedSlot: null
        });
        this.updateRawData(updatedTimeslots);
    }
    
    // Handle saving a timeslot (new or edited)
    handleSaveSlot() {
        const { timeslots } = this.state;
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
                date: this.props.date,
                bookingProbability: 0.5,
                isBooked: false,
                appointmentType: 'In-person appointment',
                resource: 'Default',
                rawData: null
            };
            
            updatedTimeslots = [...timeslots, slotToAdd];
        } else {
            // Update existing slot
            updatedTimeslots = timeslots.map(slot => 
                slot.id === selectedSlot.id ? { ...slot, ...selectedSlot } : slot
            );
        }
        
        this.setState({
            timeslots: updatedTimeslots,
            selectedSlot: null,
            isAddingSlot: false,
            newSlot: {
                professionalId: null,
                start: null,
                end: null
            }
        });
        
        this.updateRawData(updatedTimeslots);
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
    
    // Get color based on booking probability and booking status
    getProbabilityColor(slot) {
        // If the slot is booked, use a gray color
        if (slot.isBooked) {
            return '#808080'; // Gray color for booked slots
        }
        
        // For unbooked slots, use probability-based colors from the provided palette
        const probability = slot.bookingProbability;
        if (probability === undefined) return 'rgb(0, 147, 146)'; // Default to first color in palette
        
        // Clamp probability between 0 and 1 for safety
        const p = Math.max(0, Math.min(1, probability));
        
        // Define the color palette (from green to red)
        const colorPalette = [
            "rgb(0, 147, 146)",    // First green
            "rgb(57, 177, 133)",
            "rgb(156, 203, 134)",
            "rgb(233, 226, 156)",  // Yellow-ish
            "rgb(238, 180, 121)",
            "rgb(232, 132, 113)",
            "rgb(207, 89, 126)"    // Last red
        ];
        
        // Calculate which color to use based on probability
        // p=0 means highest index (most red), p=1 means lowest index (most green)
        const index = Math.floor((1 - p) * (colorPalette.length - 1));
        
        return colorPalette[index];
    }
    
    // Render a single slot rectangle
    renderSlotRectangle(slot) {
        if (!slot) return null;
        
        const { slotDuration } = this.props || {};
        if (!slotDuration) return null;
        
        try {
            // Get the number of cells this slot should span
            const numCellsToSpan = this.getSlotWidth(slot, slotDuration);
            
            const slotStyle = {
                position: 'absolute',
                top: '2px',
                left: '0',
                height: 'calc(100% - 4px)',
                width: `calc(${numCellsToSpan * 100}% + ${numCellsToSpan - 1}px)`,
                boxSizing: 'border-box',
                backgroundColor: this.getProbabilityColor(slot),
                color: 'white',
                borderRadius: '0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: slot.isBooked ? 'not-allowed' : (this.state.isDragging ? 'grabbing' : 'grab'),
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                zIndex: 100,
                transition: 'all 0.15s ease-in-out',
                opacity: slot.isBooked ? 0.8 : 1
            };
            
            // Make handles thinner - 1px instead of 4px
            const handleStyle = {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '1px', // 1px thin handles (visual appearance)
                cursor: 'ew-resize',
                backgroundColor: 'rgba(255, 255, 255, 0.5)', // Slightly more visible
                transition: 'background-color 0.2s ease'
            };

            const leftHandleStyle = {
                ...handleStyle,
                left: 0, // Position at the edge
                borderRadius: '0'
            };

            const rightHandleStyle = {
                ...handleStyle,
                right: 0, // Position at the edge
                borderRadius: '0'
            };
            
            // Add wider invisible handles for easier grabbing (clickable area)
            const invisibleHandleStyle = {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '3px', // 3px wide clickable area
                cursor: 'ew-resize',
                backgroundColor: 'transparent', // Invisible
                zIndex: 101 // Higher z-index to ensure it's above the visible handle
            };
            
            const leftInvisibleHandleStyle = {
                ...invisibleHandleStyle,
                left: '-1px' // Extend 1px to the left, keeping 2px inside
            };
            
            const rightInvisibleHandleStyle = {
                ...invisibleHandleStyle,
                right: '-1px' // Extend 1px to the right, keeping 2px inside
            };

            return (
                <div 
                    key={`slot-${slot.id}`} 
                    style={slotStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!slot.isBooked) {
                            this.handleSlotClick(slot);
                        }
                    }}
                    onMouseDown={(e) => {
                        if (!slot.isBooked && e.target === e.currentTarget) {
                            this.handleDragStart(e, slot, 'move');
                        }
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!slot.isBooked) {
                            this.handleRemoveSlot(slot.id);
                        }
                    }}
                    title={`Time slot: ${slot.start} - ${slot.end}
${slot.isBooked ? 'Status: Booked' : `Booking probability: ${Math.round((slot.bookingProbability || 0.5) * 100)}%`}
Right-click to remove
Drag edges to resize
Drag middle to move`}
                >
                    {!slot.isBooked && (
                        <>
                            {/* Visual handles (thin) */}
                            <div
                                style={leftHandleStyle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                                }}
                            />
                            <div
                                style={rightHandleStyle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                                }}
                            />
                            
                            {/* Invisible wider handles for easier grabbing */}
                            <div
                                style={leftInvisibleHandleStyle}
                                onMouseDown={(e) => this.handleDragStart(e, slot, 'start')}
                                onMouseEnter={(e) => {
                                    const visibleHandle = e.currentTarget.previousSibling;
                                    if (visibleHandle) {
                                        visibleHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const visibleHandle = e.currentTarget.previousSibling;
                                    if (visibleHandle) {
                                        visibleHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                                    }
                                }}
                            />
                            <div
                                style={rightInvisibleHandleStyle}
                                onMouseDown={(e) => this.handleDragStart(e, slot, 'end')}
                                onMouseEnter={(e) => {
                                    const visibleHandle = e.currentTarget.previousSibling.previousSibling;
                                    if (visibleHandle) {
                                        visibleHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const visibleHandle = e.currentTarget.previousSibling.previousSibling;
                                    if (visibleHandle) {
                                        visibleHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                                    }
                                }}
                            />
                        </>
                    )}
                </div>
            );
        } catch (error) {
            console.error("Error rendering slot rectangle:", error);
            return null;
        }
    }
    
    // Format time for display (HH:MM)
    formatTime(hour, minute) {
        return `${Math.floor(hour).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Generate time cells for each hour and minute interval
    generateTimeCells(professional, styles) {
        const { startHour, endHour, slotDuration } = this.props;
        const { timeslots, dragPreview, isDragging, dragType } = this.state;
        const slotsPerHour = 60 / slotDuration;
        const cells = [];
        
        // Filter slots for this professional
        const professionalSlots = timeslots.filter(slot => slot.professionalId === professional.id);
        
        // Group slots by their start time
        const slotsByStartTime = {};
        professionalSlots.forEach(slot => {
            const [hour, minute] = slot.start.split(':').map(Number);
            const key = `${hour}:${minute}`;
            slotsByStartTime[key] = slot;
        });
        
        // Check if we are dragging a slot for this professional
        const isPreviewingForThisProfessional = 
            dragPreview && dragPreview.professionalId === professional.id;
        
        // Determine which slots should be hidden during drag preview (only the one being dragged)
        const slotBeingDragged = isDragging && isPreviewingForThisProfessional ? dragPreview.id : null;
        
        // For each time cell in the grid
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
                
                // Create cell style
                const cellStyle = {
                    ...styles.dashGanttTimeCell,
                    backgroundColor: isHovered ? '#fafafa' : 'transparent',
                    borderLeft: minute === 0 ? '1px solid #eaeaea' : 'none',
                    position: 'relative'
                };
                
                // Check if this cell should show the preview
                const cellTimeDecimal = hour + (minute / 60);
                const isInPreviewRange = isPreviewingForThisProfessional && 
                                      this.timeToDecimal(dragPreview.start) <= cellTimeDecimal && 
                                      this.timeToDecimal(dragPreview.end) > cellTimeDecimal;
                
                // Prepare cell content
                let cellContent;
                
                if (isDragging && isInPreviewRange) {
                    // Only show the preview - no opaque original slot
                    const borderStyle = 'solid';
                    
                    cellContent = (
                        <>
                            {/* Only show non-dragged slots */}
                            {slot && slot.id !== slotBeingDragged && this.renderSlotRectangle(slot)}
                            
                            {/* Preview overlay */}
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: '0',
                                right: '0',
                                bottom: '2px',
                                backgroundColor: 'rgba(33, 150, 243, 0.4)',
                                border: `1px ${borderStyle} #1976D2`,
                                pointerEvents: 'none',
                                zIndex: 95
                            }} />
                            
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
                        </>
                    );
                } else {
                    // Normal case - just show the slot if there is one
                    cellContent = (
                        <>
                            {/* Hide original slot only if it's being dragged */}
                            {(!isDragging || slot?.id !== slotBeingDragged) && slot && this.renderSlotRectangle(slot)}
                            
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
                        </>
                    );
                }
                
                // Create and add the cell
                cells.push(
                    <td 
                        key={`cell-${professional.id}-${displayTimeKey}`}
                        style={cellStyle}
                        onClick={() => this.handleCreateSlot(professional.id, hour, minute)}
                        onMouseEnter={() => this.handleCellHover(professional.id, hour, minute)}
                        onMouseLeave={this.handleCellLeave}
                        title={`Time: ${timeDisplay}`}
                    >
                        {cellContent}
                    </td>
                );
            }
        }
        
        return cells;
    }
    
    // Get cached slot width or calculate it if not in cache
    getSlotWidth(slot, slotDuration) {
        if (!slot || !slot.start || !slot.end || !slotDuration) {
            return 1; // Default to 1 if any required values are missing
        }
        
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
    
    // Update raw data when timeslots change
    updateRawData(timeslots) {
        const { rawData, onDataChange, setProps } = this.props;
        
        // Create a fresh array for the updated raw data
        // Instead of just creating a copy and modifying it
        let updatedRawData = [];
        
        // First, filter existing data if needed
        if (rawData && rawData.length > 0) {
            // Keep track of which timeslots are still valid
            const validTimeslots = new Set();
            
            // Generate lookup keys for all currently valid timeslots
            timeslots.forEach(slot => {
                const doctorName = this.state.professionals.find(p => p.id === slot.professionalId)?.name;
                if (doctorName) {
                    const key = `${slot.date} ${slot.start}_${doctorName}`;
                    validTimeslots.add(key);
                }
            });
            
            // Only keep raw data items that correspond to slots we still have
            updatedRawData = rawData.filter(item => {
                // Skip items that don't have the required fields
                if (!item.datetime || !item.laakari) return false;
                
                // Create a key to match against our valid timeslots
                const key = `${item.datetime}_${item.laakari}`;
                return validTimeslots.has(key);
            });
        }
        
        // Now process all current timeslots to update or add them
        timeslots.forEach(timeslot => {
            const originalData = timeslot.rawData;
            const doctorName = this.state.professionals.find(p => p.id === timeslot.professionalId)?.name;
            if (!doctorName) return;
            
            // For existing slots
            if (originalData) {
                // Calculate duration from start and end time
                const [startHours, startMinutes] = timeslot.start.split(':').map(Number);
                const [endHours, endMinutes] = timeslot.end.split(':').map(Number);
                
                // Handle crossing midnight if needed
                let durationMinutes;
                if (endHours < startHours || (endHours === startHours && endMinutes < startMinutes)) {
                    // End time is on the next day
                    durationMinutes = ((endHours + 24) * 60 + endMinutes) - (startHours * 60 + startMinutes);
                } else {
                    durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
                }
                
                // Find the corresponding row in the filtered raw data
                const rowIndex = updatedRawData.findIndex(row => 
                    row.datetime === `${timeslot.date} ${timeslot.start}` &&
                    row.laakari === doctorName
                );
                
                if (rowIndex !== -1) {
                    // Update the existing row
                    updatedRawData[rowIndex] = {
                        ...updatedRawData[rowIndex],
                        datetime: `${timeslot.date} ${timeslot.start}`,
                        kesto_min: durationMinutes,
                        tyhja: timeslot.isBooked ? 0 : 1,
                        bookingProbability: timeslot.bookingProbability || 0.5
                    };
                } else {
                    // The row was removed during filtering, add it back
                    updatedRawData.push({
                        datetime: `${timeslot.date} ${timeslot.start}`,
                        laakari: doctorName,
                        kesto_min: durationMinutes,
                        tyhja: timeslot.isBooked ? 0 : 1,
                        bookingProbability: timeslot.bookingProbability || 0.5
                    });
                }
            } 
            // For new slots
            else if (!originalData && timeslot.start && timeslot.end) {
                // Calculate duration
                const [startHours, startMinutes] = timeslot.start.split(':').map(Number);
                const [endHours, endMinutes] = timeslot.end.split(':').map(Number);
                
                let durationMinutes;
                if (endHours < startHours || (endHours === startHours && endMinutes < startMinutes)) {
                    durationMinutes = ((endHours + 24) * 60 + endMinutes) - (startHours * 60 + startMinutes);
                } else {
                    durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
                }
                
                // Create and add a new row
                updatedRawData.push({
                    datetime: `${timeslot.date} ${timeslot.start}`,
                    laakari: doctorName,
                    kesto_min: durationMinutes,
                    tyhja: timeslot.isBooked ? 0 : 1,
                    bookingProbability: timeslot.bookingProbability || 0.5,
                    toimipiste: "Default",
                    aikaryhman: "Default",
                    aikaryhma: "Default",
                    RESURSSI: "Default",
                    specialty: "Default",
                    ETNS_A: 1,
                    ETNS_B: 1
                });
            }
        });
        
        // Call the callback if provided
        if (onDataChange) {
            onDataChange(updatedRawData);
        }

        // Update Dash props if setProps is available
        if (setProps) {
            setProps({ rawData: updatedRawData });
        }
    }
    
    // Add these new methods for handling drag operations
    handleDragStart(e, slot, type) {
        e.stopPropagation();
        if (slot.isBooked) return;
        
        // For move operations, capture the initial mouse position and offset
        const initialMouseX = e.clientX;
        let initialOffset = 0;
        
        if (type === 'move' && this.tableRef.current) {
            const tableRect = this.tableRef.current.getBoundingClientRect();
            // Calculate initial offset based on the position within the slot
            const slotStart = this.timeToDecimal(slot.start) - this.props.startHour;
            const hoursPerDay = this.props.endHour - this.props.startHour;
            const pixelsPerHour = tableRect.width / hoursPerDay;
            
            // Calculate offset from the start of the slot in pixels
            initialOffset = initialMouseX - (tableRect.left + slotStart * pixelsPerHour);
        }
        
        this.setState({
            isDragging: true,
            dragType: type,
            draggedSlot: slot,
            originalSlot: { ...slot },
            dragPreview: { ...slot }, // Start with original slot as preview for smoother transitions
            initialMouseX,
            initialOffset
        });

        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.handleDragEnd);
    }

    handleDrag(e) {
        if (!this.state.isDragging || !this.tableRef.current) return;

        const { slotDuration } = this.props;
        const { draggedSlot, dragType, initialOffset } = this.state;

        // Get accurate table dimensions
        const tableRect = this.tableRef.current.getBoundingClientRect();
        const hoursPerDay = this.props.endHour - this.props.startHour;
        const pixelsPerHour = tableRect.width / hoursPerDay;
        
        // Calculate relative mouse position with offset adjustment for "move" operations
        let relativeX;
        if (dragType === 'move') {
            relativeX = e.clientX - tableRect.left - initialOffset;
        } else {
            relativeX = e.clientX - tableRect.left;
        }
        
        // Constrain the position to the table bounds
        relativeX = Math.max(0, Math.min(relativeX, tableRect.width));
        
        // Convert pixel position to time
        const hoursFromStart = relativeX / pixelsPerHour;
        const totalHours = this.props.startHour + hoursFromStart;
        
        // Calculate hours and minutes
        const hour = Math.floor(totalHours);
        const minute = Math.floor((totalHours - hour) * 60);
        
        // Snap to grid
        const snappedMinute = Math.round(minute / slotDuration) * slotDuration;
        const newTime = `${Math.min(23, Math.max(0, hour)).toString().padStart(2, '0')}:${snappedMinute.toString().padStart(2, '0')}`;
        
        // Create a copy of the slot to update
        const updatedSlot = { ...draggedSlot };
        
        if (dragType === 'move') {
            // For moving, calculate duration and preserve it
            const startDecimal = this.timeToDecimal(draggedSlot.start);
            const endDecimal = this.timeToDecimal(draggedSlot.end);
            const duration = endDecimal - startDecimal;
            
            // Set new start time based on grid-snapped position
            updatedSlot.start = newTime;
            
            // Calculate new end time by adding the duration
            const newEndDecimal = this.timeToDecimal(newTime) + duration;
            updatedSlot.end = this.decimalToTime(newEndDecimal);
        } else if (dragType === 'start') {
            // For resizing the start, ensure it doesn't go past the end
            const endDecimal = this.timeToDecimal(draggedSlot.end);
            const newStartDecimal = this.timeToDecimal(newTime);
            
            if (newStartDecimal < endDecimal) {
                updatedSlot.start = newTime;
            } else {
                // If trying to drag start beyond end, cap it
                updatedSlot.start = this.decimalToTime(endDecimal - (slotDuration / 60));
            }
        } else if (dragType === 'end') {
            // For resizing the end, ensure it doesn't go before the start
            const startDecimal = this.timeToDecimal(draggedSlot.start);
            const newEndDecimal = this.timeToDecimal(newTime);
            
            if (newEndDecimal > startDecimal) {
                updatedSlot.end = newTime;
            } else {
                // If trying to drag end before start, cap it
                updatedSlot.end = this.decimalToTime(startDecimal + (slotDuration / 60));
            }
        }
        
        this.setState({ dragPreview: updatedSlot });
    }

    handleDragEnd() {
        const { isDragging, dragPreview, originalSlot } = this.state;
        if (!isDragging) return;

        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);

        if (dragPreview) {
            const startTime = this.timeToDecimal(dragPreview.start);
            const endTime = this.timeToDecimal(dragPreview.end);

            if (endTime <= startTime) {
                // Invalid time range, revert to original
                this.setState({
                    isDragging: false,
                    dragType: null,
                    draggedSlot: null,
                    originalSlot: null,
                    dragPreview: null
                });
                return;
            }

            // Update the slot with preview values
            const { timeslots } = this.state;
            const updatedTimeslots = timeslots.map(slot =>
                slot.id === dragPreview.id ? dragPreview : slot
            );

            this.setState({
                timeslots: updatedTimeslots,
                isDragging: false,
                dragType: null,
                draggedSlot: null,
                originalSlot: null,
                dragPreview: null
            });

            this.updateRawData(updatedTimeslots);
        }
    }
    
    // 1. First, add componentWillUnmount to clean up event listeners
    componentWillUnmount() {
        // Clean up event listeners
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
    }
    
    render() {
        const { id, date, startHour, endHour, slotDuration, backgroundColor } = this.props;
        const { professionals, timeslots } = this.state;
        
        // Calculate number of time slots per hour (e.g., 12 for 5-minute slots)
        const slotsPerHour = 60 / slotDuration;
        
        // Calculate total number of slots in the timeline
        const totalSlots = (endHour - startHour) * slotsPerHour;
        
        // Calculate a reasonable cell width in pixels - each hour should be at least 60px wide
        const hourWidth = 60;
        const cellWidth = hourWidth / slotsPerHour;
        
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
                tableLayout: 'fixed',
                // Each hour is at least hourWidth pixels, plus professional column
                minWidth: `${150 + (endHour - startHour) * hourWidth}px`
            },
            dashGanttHeaderRow: {
                backgroundColor: backgroundColor || '#ffffff' // White background like simple_white theme
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
                backgroundColor: backgroundColor || '#ffffff', // Use same background color as headers
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
                // We're setting a minimum width based on a reasonable cell size
                minWidth: '5px', 
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
                    <table ref={this.tableRef} style={styles.dashGanttTable}>
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
    rawData: [],
    date: new Date().toISOString().split('T')[0],
    startHour: 6,
    endHour: 24,
    slotDuration: 20,
    backgroundColor: '#f5f5f5',
    onDataChange: null
};

DashGantt.propTypes = {
    id: PropTypes.string,
    rawData: PropTypes.arrayOf(
        PropTypes.shape({
            datetime: PropTypes.string.isRequired,
            laakari: PropTypes.string.isRequired,
            kesto_min: PropTypes.number.isRequired,
            tyhja: PropTypes.number.isRequired
        })
    ),
    date: PropTypes.string,
    startHour: PropTypes.number,
    endHour: PropTypes.number,
    slotDuration: PropTypes.number,
    backgroundColor: PropTypes.string,
    onDataChange: PropTypes.func,
    setProps: PropTypes.func
};
