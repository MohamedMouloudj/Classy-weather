//SIMPLE TEST TO UNDERSTAND THE CONCEPT

import React from "react";

class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
    };
    this.handleIncrement = this.handleIncrement.bind(this);
    this.handleDecrement = this.handleDecrement.bind(this);
  }
  //   handleDecrement = () => {
  //     console.log(this);
  //   }; //arrow function , no need to bind "this"
  handleIncrement() {
    this.setState((currState) => {
      return { count: currState.count + 1 };
    });
  } //normal function , need to bind "this", and this happens in the constructor
  handleDecrement() {
    this.setState((currState) => {
      return { count: currState.count - 1 };
    });
  }
  render() {
    const date = new Date();
    date.setDate(date.getDate() + this.state.count);
    return (
      <div>
        <button onClick={this.handleIncrement}>+</button>
        <span>
          {" "}
          {date.toDateString()} [{this.state.count}]
        </span>
        <button onClick={this.handleDecrement}>-</button>
      </div>
    );
  }
}

export default Counter;
