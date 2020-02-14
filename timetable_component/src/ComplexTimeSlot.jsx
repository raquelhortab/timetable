class ComplexTimeSlot extends TimeSlot{

    constructor(props){
        super(props);
        this.state = {
            value: props.initialValue || []
        };
    }

    onMouseMoveHandler(){
        // complex timetables are not clickable for now
    }
    onClickHandler(){
        // complex timetables are not clickable for now
    }

    color(){

        var colorList = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075'];
        var gradualColorList = []; // TODO

        if(this.state.value.length > 1) return "black";
        else if(this.state.value.length === 1) return (colorList[parseInt(this.state.value[0]) % colorList.length]);
        else return "#b3b3b3";

    }

    getContent(){
        return((this.parent().props.showText && this.state.value.length > 0) ? this.props.value.toString()  : "");
    }

}


