const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const app = express();

app.use(bodyParser.json());
app.use(cors());

const DB= knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'Nabi786110',
      database : 'smart-brain'
    }
  });

  DB.select('*').from('users').then(data =>{
      console.log(data)
  })

/* const DB = {
    users: [
        {
            id : '123',
            name : 'john',
            email : 'john@gmail.com',
            password: 'cookies',
            entries : 0,
            joined : new Date()
        },
        {
            id : '124',
            name : 'sally',
            email : 'sally@gmail.com',
            password: 'strawberry',
            entries : 0,
            joined : new Date()
        },
        {
            id: "125",
            name: "clark",
            email: "clark@gmail.com",
            entries: 0,
            joined: "2020-08-10T20:27:00.170Z"
        }

    ],
    login : [
        {
            id: '82',
            hash: '', 
            email: 'john@gmail.com'
        }
    ]
} */

app.get('/', (req, res)=>{
    res.send(DB.users)
})



/* // Load hash from your password DB.
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
}); */

app.post('/signin', (req, res)=>{
    
    DB.select('email','hash').from('login')
        .where('email', '=' , req.body.email)
        .then(data =>{
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if(isValid){
               return DB.select('*')
                    .from('users')
                    .where('email', '=', req.body.email)
                    .then(user=>{
                        res.json(user[0])
                    })
                    .catch(err=>res.status(400).json('Unable to get user'))
                }else{
                    res.status(400).json('Wrong credentials')
                }
        })
        .catch(err=>res.status(400).json('Wrong credentials'))
})

app.post('/register',(req,res)=>{
    const {email,name,password} = req.body;
    const hash = bcrypt.hashSync(password);
    DB.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
       })
       .into('login')
       .returning('email')
       .then(loginEmail =>{
           return trx('users')
           .returning('*')
           .insert({
               email: loginEmail[0],
               name: name,
               joined: new Date()
           })
           .then(user => {
               res.json(user[0]);
           })
       })
       .then(trx.commit)
       .catch(trx.rollback)
    }) 
    .catch(err => res.status(400).json('Unable to register'))   
})

app.get('/profile/:id', (req,res)=>{
    const {id} = req.params;
    DB.select('*')
        .from('users')
        .where({id})
        .then(user => {
            if(user.length){
                res.json(user[0])
            }else{
                res.status(400).json('User not found!')
            }  
        })
        .catch(err => res.status(400).json('Error getting user.'))
})

app.put('/image', (req,res)=>{
    const {id} = req.body;
   
    DB('users').where('id','=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries=>{
        res.json(entries[0])
    })
    .catch(err=>res.status(400).json('Unable to get entries!'))
})

app.listen(4000, () =>{
    console.log("listening to app on port 4000");
})


/* Routes
/ --> res = this is working
/signin --> POST = success/fail 
/register --> POST = user 
/profile/:userId --> GET= user  
/image --> PUT  = updated user 

*/
