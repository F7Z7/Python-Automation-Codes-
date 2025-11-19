#this is a file i made for testing and familirzing with selenium
#basic code only



import time
from selenium import webdriver
from selenium.webdriver.common.by import By

driver=webdriver.Chrome()
driver.get("https://f7z7.github.io/Learning-Js/")


button=driver.find_element(By.ID, "getVerseBtn")

button.click()

time.sleep(5)

output_verse=driver.find_element(By.ID, "verseContainer")
print(output_verse.text)


driver.quit()