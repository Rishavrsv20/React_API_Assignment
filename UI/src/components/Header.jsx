import React from 'react';



function Header(props){

    return (<div>
                 <div className='img-container'>
                   <img src={props.im} alt=""/>
                 </div>
                 <header>
                   <h1 className="dashboard-title">Transaction Dashboard</h1>
                 </header>  

    </div>)
  

}
export default Header;