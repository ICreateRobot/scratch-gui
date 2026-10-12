let projectData=null

function set(a){
    console.log('设置')
    
    projectData=a
    console.log(projectData)
}

function get(){
    console.log('读取')
    console.log(projectData)
    return projectData
}
exports={
    set,
    get
}