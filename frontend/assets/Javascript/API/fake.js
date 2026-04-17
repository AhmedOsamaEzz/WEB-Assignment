

export async function registerUser(Username, UserEmail, UserPassword,UserRole){
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            try{
                const users=JSON.parse(localStorage.getItem("users")) || [];

                const EmailTaken=users.some(u => u.email===UserEmail);
                if(EmailTaken){
                    return reject({ message: "Email already registered" });
                }

                const NewUser = {
                    email: UserEmail,
                    username: Username,
                    password: UserPassword,
                    role: UserRole
                };
                users.push(NewUser);
                localStorage.setItem("users",JSON.stringify(users));

                resolve({ message: "User registered successfully" });
            }
            catch(error){
                reject({ message: "Database error: Could not process user list." });
            }
        }, 800);
    });
}


export async function loginUser(UserEmail, UserPassword,StayloggedIn){
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            try{
                const users=JSON.parse(localStorage.getItem("users")) || [];
                const foundUser=users.find(u => u.email===UserEmail && u.password===UserPassword);
                if(!foundUser) return reject({ message: "Invalid email or password" });
                const user_info={
                    // fake hashing base 64
                    token:btoa(foundUser.email + ":" + Date.now()),
                    role: foundUser.role,
                    name: foundUser.username
                };
                if(StayloggedIn==true){
                    localStorage.setItem("user_info", JSON.stringify(user_info));
                }
                else{
                    sessionStorage.setItem("user_info", JSON.stringify(user_info));
                }
                resolve({ message: "User logged in successfully" });
            }
            catch(error){
                reject({ message: "Database error: Could not process user list." });
            }
        }, 800);
    });
}