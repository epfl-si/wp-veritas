import React from 'react';

export const AlertSuccess = (props) => (
  <div className="alert alert-success" role="alert">
    {props.message} 
  </div>
);

export const Loading = () => (
  <h1>Loading...</h1>
);