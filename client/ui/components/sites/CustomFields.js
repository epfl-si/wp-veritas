import React from 'react';

export const CustomInput = ({ field, form: { errors }, ...props }) => {
  return (
    <div className="form-group">
      <label>{ props.label }</label>
      <input 
        { ...field } 
        { ...props } 
        className={errors[field.name] ? "is-invalid form-control" : "form-control"}
      />
    </div>
  )
}

export const CustomTextarea = ({ field, form: { errors }, ...props}) => {
  return (
    <div className="form-group">
      <label>{ props.label }</label>
      <textarea 
        { ...field} 
        { ...props } 
        id={field.name} 
        className="form-control" 
        rows="5" 
        cols="33" ></textarea>
    </div>
  )
}
    
export const CustomSelect = ({ field, form, ...props }) => {
  return (
    <div className="form-group">
      <label>{ props.label }</label>
      <select 
        { ...field }
        { ...props }
        className="form-control" />
    </div>
  )
}
  
export const CustomCheckbox = ({ field, form, ...props }) => {
  return (
    <div className="form-group form-check form-check-inline">
      <input 
        { ...field } 
        { ...props } 
        checked={form.values.languages.includes(field.value)} 
        onChange={() => {
          if (form.values.languages.includes(field.value)){
            const nextValue = form.values.languages.filter(
              value => value !== field.value
            );
            form.setFieldValue(field.name, nextValue);
          } else {
            const nextValue = form.values.languages.concat(field.value);
            form.setFieldValue(field.name, nextValue);
          }
        }}
        className={form.errors[field.name] ? "is-invalid form-check-input" : "form-check-input"}
        id={field.value} />
      <label className="form-check-label" htmlFor={field.value}>{ props.label }</label>
    </div>
  )
}
  
export const CustomError = (props) => {
  return (
    <div className="text-danger mb-4">{ props.children }</div> 
  )
}