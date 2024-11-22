import React,{useState} from 'react';
import { IoSearchOutline } from "react-icons/io5";



function FilterSearch(props) {

    const [search,setState]=useState("");
        
    function updateSearch(event) {
        const Text1=event.target.value;
        setState({ search: event.target.value });
        
      };




    return ( <div className="input-container">
    <IoSearchOutline size={20} />
    <input
      type="search"
      placeholder="Search Transactions"
      className="search-input"
       onChange={updateSearch}
    />
    <button type="submit" onClick={() =>{
        props.onSearch(search);
        //setState("");

        }
        } className="custom-button">Submit</button>

  </div>
        
    );





}

export default FilterSearch;