# react-dynamics

User interaction building blocks for React

## Overview

This library defines simple building blocks for coding complex interactions.

Approach:

- declarative, JSX-oriented
- some assembly effort required
- extra care to avoid timing bugs
- composition using [function-as-child](https://medium.com/merrickchristensen/function-as-child-components-5f3920a9ace9) technique

Core areas:

- DOM interaction affordances
    - `Focusable`: track DOM focus state for an element and all of its children
    - `Hoverable`: track DOM mouse hover status
    - `Movable`: track mouse and touch movement for gestures and dragging
    - `Pressable`: track mouse click and touch status for gestures and dragging
- abstract interaction state
    - `Data`: request data on demand and asynchronously wait for result
    - `Prompt`: status tracker triggered by a function call, trackable as a promise
    - `Timeout`: basic timeout state triggered via prop
