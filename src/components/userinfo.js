import {useState,useEffect} from 'react'
import { collection, addDoc, getDocs,query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
//to export the shopid and user id to add a product
//to remove a product we would need shopid and productid
//to display the product we would need shopid from userid

//Get userid from local storage
//this is to test
//localStorage.setItem("userid", "rOBMQ2CQBQRdv4peSwo98lgYRey2");

export const useUserId= ()=>{
    const[userid,setuserid]=useState("");
    useEffect(()=>{
        const myuserid=localStorage.getItem('userid');
        setuserid(myuserid);


    },[]);
    return userid;
    
}


//next we get the shopid and productid using userid
export const useShopId= ()=>{
    const[userid,setuserid]=useState("");
    useEffect(()=>{
        const myuserid=localStorage.getItem('userid');
        setuserid(myuserid);


    },[]);

    const[shopid,setshopid]=useState("");
    useEffect(()=>{
        const fetchshopid=async()=>{
        const q=query(collection(db,"Shops"),where("userid","==",userid))
        const snapshot= await getDocs(q);
        snapshot.forEach((doc) => {
            setshopid(doc.id);
            
        });
        
        };



        fetchshopid();

    },[userid]);
    return shopid;

}





