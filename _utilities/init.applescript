set mongourl to "the/mongo/url"
set dir to "the/absolute/path"
tell application "Terminal"
	do script "cd " & dir & " && MONGO_URL=" & mongourl & " electrify"
end tell