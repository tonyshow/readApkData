require("shelljs/global");
var fs = require("fs");
var path = require("path");
var join = path.join
var _ = require('underscore'); 
var async = require("async");
const { exec } = require("child_process");
var app = module.exports = {}
app.main = function(){
    app.zipApk()
} 
app.mkdirsSync = function (dirname) {
    if (fs.existsSync(dirname)) {
        return true
    } else {
        if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
        }
    }
}

app.findAllFolder = function (path, cb, isRecursion) {
    let files = fs.readdirSync(path) 
    files.forEach((item, index) => {
      let fPath = join(path, item)
      let stat = fs.statSync(fPath) 
      if (stat.isDirectory() === true) {
        cb(fPath, item)
        if (true == isRecursion) {
          this.findAllFolder(fPath, cb, isRecursion)
        }
      }
    })
}

app.findAllFile = function (path, cb, isRecursion) {
    let files = fs.readdirSync(path) 
    files.forEach((item, index) => {
      let fPath = join(path, item)
      let stat = fs.statSync(fPath) 
      if (stat.isDirectory() === true) { 
        if (true == isRecursion) {
          this.findAllFile(fPath, cb, isRecursion)
        }
      }else{
        cb(fPath, item)
      }
    })
}

/**
 * 解压apk文件
 */
app.zipApk = function(){
    console.log("开始解压apk","" )
    let outCrackPath = path.resolve(__dirname,"./outCrack"); 
    let findZipPath = path.resolve(__dirname,"./zipFile"); 
    let findApkPath = path.resolve(__dirname,"./apkFile"); 
    let files = fs.readdirSync(findApkPath);

    let allApkFileList=[];

    let lastNewFileInfo=null;
    let tmplastTime=0;
    files.forEach(function (item, index) {
        let fApkPath = join(findApkPath,item);
        // http://nodejs.cn/api/fs.html#fs_class_fs_stats
        let stat = fs.statSync(fApkPath); 
        if (stat.isFile() === true && item.indexOf(".apk")>-1) { 
            console.log("apk文件:",fApkPath )
            /**
                atime "访问时间" - 上次访问文件数据的时间。由 mknod(2)、 utimes(2) 和 read(2) 系统调用更改。
                mtime "修改时间" - 上次修改文件数据的时间。由 mknod(2)、 utimes(2) 和 write(2) 系统调用更改。
                ctime "更改时间" - 上次更改文件状态（修改索引节点数据）的时间。由 chmod(2)、 chown(2)、 link(2)、 mknod(2)、 rename(2)、 unlink(2)、 utimes(2)、 read(2) 和 write(2) 系统调用更改。
                birthtime "创建时间" - 创建文件的时间。当创建文件时设置一次。 在不支持创建时间的文件系统上，该字段可能改为保存 ctime 或 1970-01-01T00:00Z（即 Unix 纪元时间戳 0）。 在这种情况下，该值可能大于 atime 或 mtime。 在 Darwin 和其他的 FreeBSD 衍生系统上，也可能使用 utimes(2) 系统调用将 atime 显式地设置为比 birthtime 更早的值。
            */ 
            if(tmplastTime<stat.mtimeMs){
                    tmplastTime=stat.mtimeMs 
                    lastNewFileInfo={
                        filePath:fApkPath,
                        fileName:item
                    };
            }
            allApkFileList.push( {mtimeMs:stat.mtimeMs,filePath:fApkPath}) 
        }else{
            // console.warn("其他文件:",fApkPath )
        }
    }); 
    console.log("检查当前有多少个apk","" )
    
    if(lastNewFileInfo===null){
        console.warn("没有找到apk文件" ); 
    }else{  
        let zipName = lastNewFileInfo.fileName;
        let fileName = zipName.replace(".apk","");
        let zipFileFolde = `${findZipPath}/${fileName}/`
        zipName=zipName.replace(".apk",".zip");
        let newoutCrackPath= `${outCrackPath}/${fileName}`
       
        async.waterfall([
            (callBack)=>{
               //清除文件夹 
               
               exec(`rm -r -f ${newoutCrackPath}`,()=>{
                    app.mkdirsSync(newoutCrackPath)
                    callBack()
               })  
            },
            (callBack)=>{ 
                console.log("生成zip:",zipName)
                let cpInfo=`cp -r -f ${lastNewFileInfo.filePath} ${findZipPath}/${zipName}` 
                exec(cpInfo,(info,err)=>{
                    console.log("成功生成zip" );
                    callBack(null)
                });
            },(callBack)=>{
                console.log("解压zip:",zipName);
                let _unzip=`unzip -aoq ${findZipPath}/${zipName}  -d ${zipFileFolde}` 
                exec(_unzip,(info,err)=>{ 
                    if(!!err){
                        console.error("解压出错zip:",err);
                    }else{
                        console.log("成功解压zip:",zipName); 
                    }
                    callBack(null)
                });
            },(callBack)=>{
                console.log("获取SHA1");
                exec(`cd ${zipFileFolde} && keytool -printcert -file META-INF/CERT.RSA`,(error,info)=>{
                    // console.log(info)
                    var list =   info.split("\n")
                    var appSignature="";
                    var SHA1="";
                    _.each( list,(txt)=>{
                        if(txt.indexOf("MD5")>-1){
                            txt=txt.replace('\t',"");
                            appSignature=txt.split("MD5:")[1]
                            var trimLeft = /^\s+/,trimRight = /\s+$/; 
                            appSignature=appSignature.replace( trimLeft, "" ).replace( trimRight, "" );
                            appSignature=appSignature.replace(/:/g,"") 
                            appSignature=appSignature.toLowerCase();
                            console.log( "应用签名:"+appSignature )
                        }else if(txt.indexOf("SHA1")>-1){
                            txt=txt.replace('\t',"");
                            SHA1=txt.split("SHA1:")[1]
                            var trimLeft = /^\s+/,trimRight = /\s+$/; 
                            SHA1=SHA1.replace( trimLeft, "" ).replace( trimRight, "" );
                            console.log( "SHA1:"+SHA1 )
                        }
                    } )
                    let saveInfo=`应用签名=${appSignature}\n
SHA1=${SHA1}\n\n`;

                    exec(`aapt dump badging ${lastNewFileInfo.filePath}`,(error,info)=>{
                        console.log(error);
                        if(!!error){

                        }else{
                            var list =   info.split("\n")
                            _.each( list,(txt,idx)=>{
                                if(txt.indexOf("package")>-1){ 
                                    console.log("txt="+txt); 
                                    txt= txt.replace(/^\s*|\s*$/g,"&&")
                                    txt= txt.replace(/ /g,"&&")
                                    let packageInfoList=txt.split("&&")
                                    _.each(packageInfoList,(txt)=>{
                                        if(txt.indexOf("=")>-1){ 
                                            txt= txt.replace(/ /g,"") 
                                            saveInfo+=txt+"\n\n";
                                        }
                                    } )
                                }
                            } ) 
                        }
                        
                        fs.writeFile(`${newoutCrackPath}/appInfo.txt`, saveInfo, {flag: 'a'}, function (err) { 
                             callBack();
                        }); 
                    })  
                });
            },
            (callBack)=>{ 
                console.log("xml文件:",`${zipFileFolde}`); 
                app.findAllFile(zipFileFolde,(fPath,fName)=>{ 
                    if( fPath.indexOf(".xml") >-1){
                        console.log("fPath:",fPath)
                        let outCrackXmlFileFullPath = fPath.replace("zipFile","outCrack");
                        let outCrackXmlFileFullFolder = outCrackXmlFileFullPath.replace(fName,"");
                        app.mkdirsSync(outCrackXmlFileFullFolder); 
                        exec(`cd /Users/pengyuewu/Library/Android/sdk/tools && java -jar AXMLPrinter2.jar ${fPath}>${outCrackXmlFileFullPath}`)
                    }
                },false)  
                callBack();
            }
        ],(err, result)=>{
            console.log("全部完成")
        }) 
    }
} 
app.main();
