import { Order as orderModel } from '../models/order.js';

const addOrder = async (req, res) => {
    // const orderModel = Order;
    const userId = req.user._id
    try {
        const {
            clientName,
            salesPerson,
            location,
            noOfPcs,
            amount,
            remark } = req.body
        if (!userId || !clientName || !salesPerson || !location || !noOfPcs || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, clientName, salesPerson, location, noOfPcs, amount',
            });
        }
        let allOrder = await orderModel.find();
        // console.log(allOrder.length + 1);
        // let orderId = allOrder.length + 1;
        let orderId =  (allOrder.length + 1).toString();
        if (orderId.length === 1)
            orderId = 'OD' + '000' + orderId;
        if (orderId.length === 2)
            orderId = 'OD' + '00' + orderId
        if (orderId.length === 3)
            orderId = 'OD' + '0' + orderId;
        const newOrder = await orderModel.create({
            userId,
            orderId,
            clientName,
            salesPerson,
            location,
            noOfPcs,
            amount,
            remark: remark || '', // Default empty string if no remark is provided
            // Default to current date/time if no date is provided
        });
        // Respond with success and the created order
        res.status(201).json({
            success: true,
            message: 'Order successfully added.',
            data: newOrder,
        });
    }
    catch (error) {
        console.error("Error adding issue:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error while adding the issue.",
            error: error.message,
        });
    }
}

const getAllOrder = async (req, res) => {
    try {
        // const orderModel = Order;
        let orders;
        const user = req.user;
        if(user.role === "admin")
          orders = await orderModel.find();
        else{
          orders = await orderModel.find({userId: user._id})
        }
        // orders = await orderModel.find();
        res.status(200).send(orders);
    } 
    catch (error) {
        console.error("Error fetching issues:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching issues.",
            error: error.message,
        });
    }
}

const updateOrderStatus = async (req, res) => {
   try{
    // const orderModel = Order;
    const userId = req.user._id;
    const Id = req.body.Id;
    if(!userId)
     res.status(404).send("User is not valid")
    if(!Id)
     res.status(404).send("Id is not found")
     const updateStatus = req.body.orderStatus;
    const updatedOrder = await orderModel.updateOne(
        { _id: Id },
        { $set: { orderStatus: updateStatus } }
    )
    res.status(200).send(updatedOrder);
   }
  catch(error){
    console.log(error);
    res.status(500).send(error);
  }
}

export {addOrder, getAllOrder, updateOrderStatus};