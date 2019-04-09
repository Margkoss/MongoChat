const MONGO_URL = 'mongodb://127.0.0.1:27017/chatserver';

const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;


//Connecting to mongo db
mongo.connect(MONGO_URL,(err,database)=>{

    if(err){
        throw err;
    }

    console.log('Mongo connected');

    //Connect to socket.io 
    client.on('connection',(socket)=>{
        let prechat = database.db('chatserver');
        let chat = prechat.collection('chat');

        //Function to create status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        //Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){

            if(err){
                throw err;
            }

            //Emit the messages
            socket.emit('output',res);
        });

        //Handle input events
        socket.on('input', (data)=>{

            let name = data.name;
            let message = data.message;
            
            //Check for name and message
            if(name == '' || message == ''){
                sendStatus('Please enter name and message');
            }
            else{
                chat.insert({name:name, message:message},function(){
                    client.emit('output',[data]);
                    
                    sendStatus({
                        message: 'message sent',
                        clear: true
                    })
                });
            }

        });

        //Handle clear 
        socket.on('clear',()=>{

            //Remove all chats from collection 
            chat.remove({},function(){

                socket.emit('cleared');

            });

        });

    });
});