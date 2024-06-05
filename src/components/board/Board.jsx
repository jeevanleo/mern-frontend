import React from "react";
import io from "socket.io-client";

import "./style.css";

class Board extends React.Component {
  constructor(props) {
    super(props);

    const socketUrl =
      process.env.NODE_ENV === "production"
        ? "https://mern-backend-aanb.onrender.com"
        : "http://localhost:5000";

    this.socket = io.connect(socketUrl);

    this.isDrawing = false;
    this.drawOnCanvas = this.drawOnCanvas.bind(this);
    this.clearCanvas = this.clearCanvas.bind(this);

    this.socket.on("canvas-data", (data) => {
      var root = this;
      var interval = setInterval(function () {
        if (root.isDrawing) return;
        root.isDrawing = true;
        clearInterval(interval);
        var image = new Image();
        var canvas = document.querySelector("#board");
        var ctx = canvas.getContext("2d");
        image.onload = function () {
          ctx.drawImage(image, 0, 0);
          root.isDrawing = false;
        };
        image.src = data;
      }, 200);
    });

    this.socket.on("clear-canvas", () => {
      var canvas = document.querySelector("#board");
      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  componentDidMount() {
    this.drawOnCanvas();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.color !== this.props.color) {
      this.ctx.strokeStyle = this.props.color;
    }
    if (prevProps.size !== this.props.size) {
      this.ctx.lineWidth = this.props.size;
    }
  }

  drawOnCanvas() {
    var canvas = document.querySelector("#board");
    this.ctx = canvas.getContext("2d");
    var ctx = this.ctx;

    var sketch = document.querySelector("#sketch");
    var sketch_style = getComputedStyle(sketch);
    canvas.width = parseInt(sketch_style.getPropertyValue("width"));
    canvas.height = parseInt(sketch_style.getPropertyValue("height"));

    var mouse = { x: 0, y: 0 };
    var last_mouse = { x: 0, y: 0 };

    /* Mouse Capturing Work */
    canvas.addEventListener(
      "mousemove",
      function (e) {
        var rect = canvas.getBoundingClientRect();
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;

        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      },
      false
    );

    /* Drawing on Paint App */
    ctx.lineWidth = this.props.size;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = this.props.color;

    canvas.addEventListener(
      "mousedown",
      (e) => {
        this.isDrawing = true;
        canvas.addEventListener("mousemove", onPaint, false);
      },
      false
    );

    canvas.addEventListener(
      "mouseup",
      () => {
        this.isDrawing = false;
        canvas.removeEventListener("mousemove", onPaint, false);
      },
      false
    );

    var onPaint = () => {
      ctx.beginPath();
      ctx.moveTo(last_mouse.x, last_mouse.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.closePath();
      ctx.stroke();

      var base64ImageData = canvas.toDataURL("image/png");
      this.socket.emit("canvas-data", base64ImageData);
    };
  }

  clearCanvas() {
    var canvas = document.querySelector("#board");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.socket.emit("clear-canvas");
  }

  render() {
    return (
      <div className="sketch" id="sketch">
        <button className="clear-button" onClick={this.clearCanvas}>
          Clear
        </button>
        <canvas className="board" id="board"></canvas>
      </div>
    );
  }
}

export default Board;
