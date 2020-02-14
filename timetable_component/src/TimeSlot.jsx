class TimeSlot extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            value: props.initialValue || false
        };
        this.onMouseMoveHandler = this.onMouseMoveHandler.bind(this);
        this.onClickHandler = this.onClickHandler.bind(this);
    }

    componentDidUpdate(prevProps) {
        if(prevProps != this.props){
            if(this.props.initialValue) this.setState({value: this.props.initialValue});
        }
    }

    onClickHandler(){
        if(this.state.value === true){
            this.parent().setState({mode: "deselect"},()=>{this.props.onClickHandler(this);})
        }
        else{
            this.parent().setState({mode: "select"},()=>{this.props.onClickHandler(this);})
        }
    }

    onMouseMoveHandler(){
        if(window.leftMouseButtonOnlyDown){
            this.props.onClickHandler(this);
        }
    }

    color(){

        var colorList = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075'];

        if(this.state.value === true) return(colorList[parseInt(this.props.timetableId) % colorList.length]);
        else return("#b3b3b3");

    }

    parent(){
        return(this.props.parent);
    }

    getContent(){
        return("");
    }

    render(){

        return(
            <div className="timetable-slot"
                 style={{backgroundColor:this.color(),gridColumn:this.props.column,gridRow:this.props.row}}
                 onMouseDown={this.onClickHandler}
                 onMouseMove={this.onMouseMoveHandler}
            >
                {this.getContent()}
            </div>
    );
    }

}


