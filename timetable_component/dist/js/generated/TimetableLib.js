class TimeSlot extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: props.initialValue || false
        };
        this.onMouseMoveHandler = this.onMouseMoveHandler.bind(this);
        this.onClickHandler = this.onClickHandler.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps != this.props) {
            if (this.props.initialValue) this.setState({ value: this.props.initialValue });
        }
    }

    onClickHandler() {
        if (this.state.value === true) {
            this.parent().setState({ mode: "deselect" }, () => {
                this.props.onClickHandler(this);
            });
        } else {
            this.parent().setState({ mode: "select" }, () => {
                this.props.onClickHandler(this);
            });
        }
    }

    onMouseMoveHandler() {
        if (window.leftMouseButtonOnlyDown) {
            this.props.onClickHandler(this);
        }
    }

    color() {

        var colorList = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075'];

        if (this.state.value === true) return colorList[parseInt(this.props.timetableId) % colorList.length];else return "#b3b3b3";
    }

    parent() {
        return this.props.parent;
    }

    getContent() {
        return "";
    }

    render() {

        return React.createElement(
            "div",
            { className: "timetable-slot",
                style: { backgroundColor: this.color(), gridColumn: this.props.column, gridRow: this.props.row },
                onMouseDown: this.onClickHandler,
                onMouseMove: this.onMouseMoveHandler
            },
            this.getContent()
        );
    }

}

class ComplexTimeSlot extends TimeSlot {

    constructor(props) {
        super(props);
        this.state = {
            value: props.initialValue || []
        };
    }

    onMouseMoveHandler() {
        // complex timetables are not clickable for now
    }
    onClickHandler() {
        // complex timetables are not clickable for now
    }

    color() {

        var colorList = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075'];
        var gradualColorList = []; // TODO

        if (this.state.value.length > 1) return "black";else if (this.state.value.length === 1) return colorList[parseInt(this.state.value[0]) % colorList.length];else return "#b3b3b3";
    }

    getContent() {
        return this.parent().props.showText && this.state.value.length > 0 ? this.props.value.toString() : "";
    }

}

class Timetable extends React.Component {

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
    constructor(props) {
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
        if (this.props.modeObserver !== undefined) modeObserver.subscribe(this.changeMode);
    }

    changeMode(mode) {
        this.setState({ mode: mode });
    }

    componentDidMount() {
        this.updateMaxSizes();
        window.addEventListener('resize', this.updateMaxSizes);
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateMaxSizes);
    }

    updateMaxSizes() {
        this.setState({
            maxRowHeight: (window.innerHeight - 130) / (this.hourRowCount() + 2) - 3,
            maxColWidth: (window.innerWidth * 0.23 - 80) / 8 - 3
        });
    }

    autoUpdate() {
        return this.props.autoUpdate;
    }

    componentDidUpdate(prevProps) {
        if (this.props.initialTimeRanges && prevProps.initialTimeRanges != this.props.initialTimeRanges) {
            this.setState({
                timeRanges: this.props.initialTimeRanges,
                timeMatrix: this.generateMatrix(this.props.initialTimeRanges)
            });
        }
    }

    emptyMatrix() {
        var rowCount = this.hourRowCount();
        return {
            monday: Array(rowCount).fill(null).map(() => false),
            tuesday: Array(rowCount).fill(null).map(() => false),
            wednesday: Array(rowCount).fill(null).map(() => false),
            thursday: Array(rowCount).fill(null).map(() => false),
            friday: Array(rowCount).fill(null).map(() => false),
            saturday: Array(rowCount).fill(null).map(() => false),
            sunday: Array(rowCount).fill(null).map(() => false)
        };
    }

    days() {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }

    translatedDays() {
        return this.props.dayNames || Timetable.dayNames || this.days();
    }

    generateMatrix(timeRanges) {
        var matrix = this.emptyMatrix();
        timeRanges.forEach(function (element, _) {
            var from = Math.max(element.from, this.startTime());
            var to = Math.min(element.to, this.endTime());
            for (var iterator = from; iterator < to; iterator += 0.5) {
                var row = this.calculateRow(iterator);
                matrix[element.day][row] = true;
            }
        }, this);
        return matrix;
    }

    calculateTimeRanges(matrix) {
        var timeRanges = [];
        var currentRange = null;
        this.days().map(x => x.toLowerCase()).forEach(function (day) {
            matrix[day].forEach(function (slot, index) {
                var hour = this.calculateHour(index);
                if (slot === true) {
                    if (!currentRange) {
                        currentRange = { from: hour, day: day, to: hour + 0.5 };
                    } else {
                        currentRange.to = hour + 0.5;
                    }
                } else {
                    if (currentRange) timeRanges.push(currentRange);
                    currentRange = null;
                }
            }, this);
            if (currentRange) timeRanges.push(currentRange);
            currentRange = null;
        }, this);
        return timeRanges;
    }

    exportData() {
        if (this.props.exportData !== undefined) {
            this.props.exportData(this.props.id, this.state.timeRanges);
        }
    }

    updateMatrix(day, hour, value) {
        var matrix = Object.assign({}, this.state.timeMatrix);
        var row = this.calculateRow(hour);
        matrix[day][row] = value;
        if (this.autoUpdate()) {
            this.setState({ timeMatrix: matrix, timeRanges: this.calculateTimeRanges(matrix) }, this.exportData);
        } else {
            this.setState({ timeMatrix: matrix });
        }

        if (this.props.publishTo !== undefined) {
            this.props.publishTo.notify({
                key: this.props.id,
                day: day,
                hour: hour,
                value: value
            });
        }
    }

    startTime() {
        return this.props.startTime || 7;
    }

    endTime() {
        return this.props.startTime || 21;
    }

    hourRowCount() {
        return Math.round((this.endTime() - this.startTime()) * 2);
    }

    calculateRow(hour) {
        return (hour - this.startTime()) * 2;
    }

    calculateHour(row) {
        return row / 2 + this.startTime();
    }

    onSlotClickHandler(slot) {
        if (this.state.mode === 'select') {
            if (slot.state.value === true) return;
            slot.setState({ value: true });
            this.updateMatrix(slot.props.day, slot.props.hour, true);
        } else {
            if (slot.state.value !== true) return;
            slot.setState({ value: false });
            this.updateMatrix(slot.props.day, slot.props.hour, false);
        }
    }

    style() {
        var rowHeight = `minmax(9px,${this.state.maxRowHeight}px)`;
        var colWidth = `minmax(20px,${this.state.maxColWidth}px)`;
        return {
            fontSize: '10px',
            display: 'grid',
            gridTemplateColumns: `[hour] ${colWidth} [monday] ${colWidth} [tuesday] ${colWidth}  [wednesday] ${colWidth} [thursday] ${colWidth} [friday] ${colWidth} [saturday] ${colWidth} [sunday] ${colWidth}`,
            gridTemplateRows: `[day] 30px  repeat(${this.hourRowCount() + 1}, ${rowHeight} )`,
            gridAutoFlow: `column`,
            gridGap: `3px`,
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            KhtmlUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none'
        };
    }

    timeSlotKind() {
        return TimeSlot;
    }

    render() {

        var header = this.days().map(function (day, index) {
            var style = {
                marginBottom: "-5px",
                marginRight: "-5px",
                WebkitTransform: "rotate(-30deg)",
                MozTransform: "rotate(-30deg)",
                transform: "rotate(-30deg)",
                gridColumn: day.toLowerCase(),
                gridRow: 'day'
            };
            return React.createElement(
                "div",
                { style: style, key: `${this.props.id}-${day}` },
                this.translatedDays()[index]
            );
        }, this);

        var hours = Array.apply(null, Array(this.hourRowCount() + 1)).map(function (_, index) {
            var time = this.startTime() + index / 2;
            var hour = Math.floor(time);
            var minutes = time * 2 % 2 == 0 ? '00' : '30';
            return React.createElement(
                "div",
                { style: { gridColumn: 'hour', gridRow: index + 2, marginTop: '-5px' }, key: `${this.props.id}-${hour}-${minutes}` },
                hour,
                ":",
                minutes
            );
        }, this);

        var timeSlots = this.days().map(function (el, index) {
            var dayHours = Array.apply(null, Array(this.hourRowCount())).map(function (_, index) {
                var day = el.toLowerCase();
                var hour = this.calculateHour(index);
                var slot = this.state.timeMatrix[day][index];
                var TimeSlotKind = this.timeSlotKind();
                return React.createElement(TimeSlotKind, { key: `${this.props.id}-${day}-${hour}`,
                    timetableId: this.props.id,
                    parent: this,
                    column: day,
                    row: index + 2,
                    initialValue: slot,
                    day: day,
                    hour: hour,
                    onClickHandler: this.onSlotClickHandler,
                    timeTableId: this.props.id,
                    showText: true });
            }, this);
            return dayHours;
        }, this).flat();

        return React.createElement(
            "div",
            { className: "timetable",
                style: this.style() },
            header,
            hours,
            timeSlots
        );
    }

}

class ComplexTimetable extends Timetable {

    /*
     A ComplexTimetable cannot be modified by clicking on time slots as it only represents the mix of a bunch of independent timetables.
    The best approach is to initialize it with a hash of timeRanges and update it via the "updateMatrix" method.
        STATE:
       timeRanges: hash where each key corresponds to a sub-timetable's id and the value corresponds to an array of timeRanges,
                   which are hashes, eg: [{day:"monday", from:7, to:15, tag:"1"},...]
                   tag is optional
       timeMatrix: autogenerated, hash of arrays with keys from "monday" to "sunday"
                   and arrays with (end-start)*2 number of items, corresponding to each half-hour slot
                   the value of each item in the arrays is a number representing the quantity of different ranges in that slot
       mode: "select", "deselect"
             determines whether a click on a slot will activate or deactivate such slot
             if props.modifiable is set to false, state.mode is ignored
    */
    constructor(props) {
        super(props);
        this.state = {
            timeRanges: this.props.initialTimeRanges || {},
            timeMatrix: this.generateMatrix(this.props.initialTimeRanges || {})
        };
        if (this.props.subscribeTo !== undefined) {
            this.props.subscribeTo.subscribe(this.updateMatrix);
        }
    }

    exportData() {}

    emptyMatrix() {
        var rowCount = this.hourRowCount();
        return {
            monday: Array(rowCount).fill(null).map(() => []),
            tuesday: Array(rowCount).fill(null).map(() => []),
            wednesday: Array(rowCount).fill(null).map(() => []),
            thursday: Array(rowCount).fill(null).map(() => []),
            friday: Array(rowCount).fill(null).map(() => []),
            saturday: Array(rowCount).fill(null).map(() => []),
            sunday: Array(rowCount).fill(null).map(() => [])
        };
    }

    //TODO: acabar aixo, en comptes de += fer push de key
    generateMatrix(timeRanges) {
        var matrix = this.emptyMatrix();
        var ids = Object.keys(timeRanges);
        ids.forEach(function (key, _) {
            var array = timeRanges[key];
            array.forEach(function (element, _) {
                var from = Math.max(element.from, this.startTime());
                var to = Math.min(element.to, this.endTime());
                for (var iterator = from; iterator < to; iterator += 0.5) {
                    var row = this.calculateRow(iterator);
                    matrix[element.day][row].push(key);
                }
            }, this);
        }, this);
        return matrix;
    }

    calculateTimeRanges(matrix) {

        //TODO
        return [];
    }

    updateMatrix(data) {
        var day = data["day"];
        var hour = data["hour"];
        var value = data["value"];
        var key = data["key"];

        var matrix = Object.assign({}, this.state.timeMatrix);
        var row = this.calculateRow(hour);
        if (value === true) matrix[day][row].push(key);else matrix[day][row] = matrix[day][row].filter(x => x !== key);
        if (this.autoUpdate()) {
            this.setState({ timeMatrix: matrix, timeRanges: this.calculateTimeRanges(matrix) });
        } else {
            this.setState({ timeMatrix: matrix });
        }
    }

    onSlotClickHandler(slot) {
        // Complex Timetables are for now unmodifiable
    }

    timeSlotKind() {
        return ComplexTimeSlot;
    }

}