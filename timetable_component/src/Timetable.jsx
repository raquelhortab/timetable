class Timetable extends React.Component{

    /*
    STATE:
    timeRanges: array of hashes, eg: [{day:"monday", from:7, to:15},...]
    timeMatrix: autogenerated, hash of arrays with keys from "monday" to "sunday"
                and arrays with (end-start)*2 number of items, corresponding to each half-hour slot
                the value of each item in the arrays is a number representing the quantity of different ranges in that slot
    mode: "select", "deselect"
          determines whether a click on a slot will activate or deactivate such slot
          if props.modifiable is set to false, state.mode is ignored
     */
    constructor(props){
        super(props);
        this.state = {
            timeRanges: this.props.initialTimeRanges || [],
            timeMatrix: this.generateMatrix(this.props.initialTimeRanges || []),
            maxRowHeight: 12,
            maxColWidth: 30,
            mode: 'select'
        };
        this.onSlotClickHandler = this.onSlotClickHandler.bind(this);
        this.updateMatrix = this.updateMatrix.bind(this);
        this.updateMaxSizes = this.updateMaxSizes.bind(this);
        this.hourRowCount = this.hourRowCount.bind(this);
        this.changeMode = this.changeMode.bind(this);
        if(this.props.modeObserver !== undefined) modeObserver.subscribe(this.changeMode);
    }

    changeMode(mode){
        this.setState({mode:mode});
    }

    componentDidMount() {
        this.updateMaxSizes();
        window.addEventListener('resize', this.updateMaxSizes);
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateMaxSizes);
    }

    updateMaxSizes(){
        this.setState({
            maxRowHeight: ((window.innerHeight-130)/(this.hourRowCount()+2))-3,
            maxColWidth: ((window.innerWidth*0.23-80)/(8))-3
        })
    }

    autoUpdate(){
        return(this.props.autoUpdate);
    }

    componentDidUpdate(prevProps) {
        if(this.props.initialTimeRanges && (prevProps.initialTimeRanges != this.props.initialTimeRanges)){
            this.setState({
                timeRanges: this.props.initialTimeRanges,
                timeMatrix: this.generateMatrix(this.props.initialTimeRanges)
            });
        }
    }

    emptyMatrix(){
        var rowCount = this.hourRowCount();
        return({
            monday: Array(rowCount).fill(null).map(()=> (false)),
            tuesday: Array(rowCount).fill(null).map(()=> (false)),
            wednesday: Array(rowCount).fill(null).map(()=> (false)),
            thursday: Array(rowCount).fill(null).map(()=> (false)),
            friday: Array(rowCount).fill(null).map(()=> (false)),
            saturday:Array(rowCount).fill(null).map(()=> (false)),
            sunday: Array(rowCount).fill(null).map(()=> (false)),
        });
    }

    days(){
        return(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    }

    translatedDays(){
        return( this.props.dayNames || Timetable.dayNames || this.days());
    }

    generateMatrix(timeRanges){
        var matrix = this.emptyMatrix();
        timeRanges.forEach(function (element, _) {
            var from = Math.max(element.from,this.startTime());
            var to = Math.min(element.to,this.endTime());
            for(var iterator = from; iterator < to ; iterator+=0.5){
                var row = this.calculateRow(iterator);
                matrix[element.day][row] = true;
            }
        }, this);
        return(matrix);
    }

    calculateTimeRanges(matrix){
        var timeRanges = [];
        var currentRange = null;
        this.days().map((x)=>x.toLowerCase()).forEach(function (day) {
            matrix[day].forEach(function (slot, index) {
                var hour = this.calculateHour(index);
                if(slot === true){
                    if(! currentRange){
                        currentRange = {from: hour, day: day, to: hour+0.5}
                    }
                    else{
                        currentRange.to = hour+0.5
                    }
                }
                else{
                    if(currentRange) timeRanges.push(currentRange);
                    currentRange = null;
                }
            }, this);
            if(currentRange) timeRanges.push(currentRange);
            currentRange = null;
        }, this);
        return(timeRanges);
    }

    exportData(){
        if(this.props.exportData !== undefined){
            this.props.exportData(this.props.id, this.state.timeRanges);
        }
    }

    updateMatrix(day, hour, value){
        var matrix = Object.assign({}, this.state.timeMatrix);
        var row = this.calculateRow(hour);
        matrix[day][row] = value;
        if(this.autoUpdate()){
            this.setState({timeMatrix: matrix,timeRanges:this.calculateTimeRanges(matrix)},this.exportData);
        }
        else{
            this.setState({timeMatrix: matrix});
        }

        if(this.props.publishTo !== undefined){
            this.props.publishTo.notify({
               key: this.props.id,
               day: day,
               hour: hour,
               value: value
            });
        }

    }

    startTime(){
        return(this.props.startTime || 7);
    }

    endTime(){
        return(this.props.startTime || 21);
    }

    hourRowCount(){
        return(Math.round((this.endTime() - this.startTime())*2));
    }

    calculateRow(hour){
        return(  (hour - this.startTime()) * 2 );
    }

    calculateHour(row){
        return( (row)/2 + this.startTime() );
    }

    onSlotClickHandler(slot){
        if(this.state.mode === 'select'){
            if(slot.state.value === true) return;
            slot.setState({value:true});
            this.updateMatrix(slot.props.day, slot.props.hour, true);
        }
        else{
            if(slot.state.value !== true) return;
            slot.setState({value:false});
            this.updateMatrix(slot.props.day, slot.props.hour, false);
        }
    }

    style(){
        var rowHeight = `minmax(9px,${this.state.maxRowHeight}px)`;
        var colWidth = `minmax(20px,${this.state.maxColWidth}px)`;
        return(
            {
                fontSize: '10px',
                display: 'grid',
                gridTemplateColumns: `[hour] ${colWidth} [monday] ${colWidth} [tuesday] ${colWidth}  [wednesday] ${colWidth} [thursday] ${colWidth} [friday] ${colWidth} [saturday] ${colWidth} [sunday] ${colWidth}`,
                gridTemplateRows: `[day] 30px  repeat(${this.hourRowCount()+1}, ${rowHeight} )`,
                gridAutoFlow: `column`,
                gridGap: `3px`,
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                KhtmlUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                userSelect: 'none'
            }
        );
    }

    timeSlotKind(){
        return(TimeSlot);
    }

    render(){

        var header = this.days().map(function (day, index) {
            var style = {
                marginBottom: "-5px",
                marginRight:"-5px",
                WebkitTransform:"rotate(-30deg)",
                MozTransform: "rotate(-30deg)",
                transform:"rotate(-30deg)",
                gridColumn:day.toLowerCase(),
                gridRow:'day'
            };
            return(<div style={style} key={`${this.props.id}-${day}`}>{this.translatedDays()[index]}</div>);
        }, this);

        var hours = Array.apply(null, Array(this.hourRowCount()+1)).map(function (_,index) {
            var time = this.startTime() + index/2;
            var hour = Math.floor(time);
            var minutes = ((time*2) % 2) == 0 ? '00' : '30';
            return(<div style={{gridColumn:'hour',gridRow:index+2, marginTop:'-5px'}} key={`${this.props.id}-${hour}-${minutes}`}>{hour}:{minutes}</div>);
        }, this);

        var timeSlots = this.days().map(function (el,index) {
            var dayHours = Array.apply(null, Array(this.hourRowCount())).map(function (_,index) {
                var day = el.toLowerCase();
                var hour = this.calculateHour(index);
                var slot = this.state.timeMatrix[day][index];
                var TimeSlotKind = this.timeSlotKind();
                return(<TimeSlotKind key={`${this.props.id}-${day}-${hour}`}
                                     timetableId={this.props.id}
                                     parent={this}
                                     column={day}
                                     row={index+2}
                                     initialValue={slot}
                                     day={day}
                                     hour={hour}
                                     onClickHandler={this.onSlotClickHandler}
                                     timeTableId={this.props.id}
                                     showText={true}/>);
            }, this);
            return(dayHours);
        },this).flat();

        return(
            <div className="timetable"
                 style={this.style()}>
                {header}
                {hours}
                {timeSlots}
            </div>
        );
    }

}

