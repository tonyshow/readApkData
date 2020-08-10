require("shelljs/global");
var fs = require("fs");
var path = require("path");
var join = path.join
var readXml = require("./readXml"); 
var async = require("async");
var app = module.exports = {}
app.main = function(){
    app.zipApk()
} 

/**
 * 解压apk文件
 */
app.zipApk = function(){
    console.log("开始解压apk","" )

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
            console.warn("其他文件:",fApkPath )
        }
    }); 
    console.log("检查当前有多少个apk","" )
    
    if(lastNewFileInfo===null){
        console.warn("没有找到apk文件" ); 
    }else{ 
        let zipName = lastNewFileInfo.fileName;
        let fileName = zipName.replace(".apk","");
        zipName=zipName.replace(".apk",".zip");
        async.waterfall([
            (callBack)=>{ 
                console.log("生成zip:",zipName)
                let cpInfo=`cp -r -f ${lastNewFileInfo.filePath} ${findZipPath}/${zipName}` 
                exec(cpInfo,(info,err)=>{
                    console.log("成功生成zip" );
                    callBack(null)
                });
            },(callBack)=>{
                console.log("解压zip:",zipName);
                let _unzip=`unzip -ao ${findZipPath}/${zipName}  -d ${findZipPath}/${fileName}/` 
                exec(_unzip,(info,err)=>{ 
                    if(!!err){
                        console.error("解压出错zip:",err);
                    }else{
                        console.log("成功解压zip:",zipName); 
                    }
                    callBack(null)
                });
            }
        ],(err, result)=>{
            console.log("全部完成")
        }) 
    }
} 
app.main();
