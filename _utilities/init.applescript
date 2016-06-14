set mongourl to "the:mongo/url"
set dir to "/Absolute/Path/to/project/"
tell application "Terminal"
	do script "cd " & dir & " && MONGO_URL=" & mongourl & " electrify"
end tell