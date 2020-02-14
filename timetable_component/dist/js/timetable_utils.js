window.leftMouseButtonOnlyDown = false;

function setLeftButtonState(e) {
    window.leftMouseButtonOnlyDown = e.buttons === undefined
        ? e.which === 1
        : e.buttons === 1;
}

document.body.onmousedown = setLeftButtonState;
document.body.onmousemove = setLeftButtonState;
document.body.onmouseup = setLeftButtonState;
