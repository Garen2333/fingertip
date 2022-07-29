# This program takes a file name as an argument (no extension!)
# A header file will be created containing a const array of bytes in the binary

import os,sys,time

if (len(sys.argv) == 1):
	# Prompt for user to input file to convert.
	file_name = input("Enter bin file name (no extension): ")
else:
	file_name = sys.argv[1];

if not(os.path.isfile(file_name+'.bin')):
	print("\n\rFile not found!");
	time.sleep(1)
	sys.exit()

# Attempt to read binary file provided as argument
try:	
	with open('%s.bin'% file_name, "rb") as myfile:
		bytes_read = myfile.read()
except IOError:
	print("\n\rFile could not be opened!")
	time.sleep(1)
	sys.exit()

# String gymnastics
localtime = time.asctime( time.localtime(time.time()) )
s =  "// Binary image\n"
s += "// Generated: " + localtime + "\n"
s += "// File name: " + file_name + ".bin\n\n"

s += "\nconst "+file_name+" = [\n\t"

# Convert all data bytes to a hex string
for i in range(len(bytes_read) -1 ):
	s += '0x%.2X,' % (bytes_read[i])
	# Place line-feeds after each 16 bytes 
	if((i+1) % 16 == 0):
		s += ("\n\t")
	else:
		if ((i+1) % 8 == 0):
			s += " "

# No comma after the last byte
s += '0x%.2X\n' % bytes_read[len(bytes_read)-1]

# Finalize the file
s += '];\n'

# Create the output file
with open(file_name+".js", "w") as text_file:
    print(s, file=text_file)
print("\n\rConversion complete...")
time.sleep(1)