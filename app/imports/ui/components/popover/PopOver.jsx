/**
 * Display a information popover using popper.js
 * See https://reactstrap.github.io/components/popovers/
 * 
 */
import React, { useState } from 'react';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import infoImg from './icons8info.svg';

const PopOver = (props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const toggle = () => setPopoverOpen(!popoverOpen);

  return (
    <span className="float-md-right">
      <img src={infoImg} width="20px" id="Popover1" type="button" />
      <Popover placement={props.placement ? props.placement : 'right'} isOpen={popoverOpen} target="Popover1" toggle={toggle}>
        <PopoverHeader>{props.title}</PopoverHeader>
        <PopoverBody>{props.description}</PopoverBody>
      </Popover>
      </span>
  );
}

export default PopOver;