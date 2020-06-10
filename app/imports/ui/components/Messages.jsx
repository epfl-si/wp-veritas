import React from "react";
import { Link } from "react-router-dom";

export const AlertSuccess = (props) => (
  <div className="alert alert-success" role="alert">
    {props.message}
  </div>
);

export const DangerMessage = (props) => (
  <div
    id={props.elementId}
    className="alert alert-danger alert-dismissible fade show mt-4"
    role="alert"
  >
    <strong>{props.title}</strong> {props.message}
    {props.additional && (
      <div className="list-error-message mt-4">
        <ul>
          {props.additional.map((site) => (
            <li>
              <Link to={`/edit/${site._id}`}>{site.url}</Link>
            </li>
          ))}
        </ul>
      </div>
    )}
    <button
      type="button"
      className="close"
      data-dismiss="alert"
      aria-label="Close"
    >
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
);

export const Loading = () => <h1>Loading...</h1>;
