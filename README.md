# ccc-os
1、Cocos game秘钥查找 
  IDA-》View->Open subviews->strings 
  Strings window
  搜索Cocos game

2、获取安卓AndroidMainfest.xml
  包名为:AXMLPrinter2.jar  https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/android4me/AXMLPrinter2.jar
  步骤： 
  1.DOWN下来以后，将该包放在ANDROID sdk安装目录下的TOOLS下 
    我的为移动到：C:\Program Files\Android\android-sdk\tools 下； 
  2.将APK通过解压缩 取出它的 AndroidManifest.xml 
    复制到 C:\Program Files\Android\android-sdk\tools 下； 
  3.运行CMD，在DOS下进入TOOL文件夹下，运行 
    java -jar AXMLPrinter2.jar AndroidManifest.xml>AndroidManifest.txt
