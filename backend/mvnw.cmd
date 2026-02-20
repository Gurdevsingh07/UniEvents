@REM ----------------------------------------------------------------------------
@REM  Maven Wrapper startup script for Windows
@REM ----------------------------------------------------------------------------
@setlocal

@set "MAVEN_VERSION=3.9.6"
@set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%"
@set "MAVEN_ZIP=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%-bin.zip"
@set "MAVEN_CMD=%MAVEN_HOME%\bin\mvn.cmd"

@REM Determine JAVA_HOME or java
@if defined JAVA_HOME (
    @set "JAVACMD=%JAVA_HOME%\bin\java.exe"
) else (
    @set "JAVACMD=java"
)

@REM Check if Maven is already downloaded
@if not exist "%MAVEN_CMD%" (
    echo Maven not found, downloading Apache Maven %MAVEN_VERSION%...
    @if not exist "%USERPROFILE%\.m2\wrapper\dists" (
        mkdir "%USERPROFILE%\.m2\wrapper\dists"
    )
    powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '%MAVEN_ZIP%'"
    echo Extracting Maven...
    powershell -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%USERPROFILE%\.m2\wrapper\dists' -Force"
    @REM The zip extracts to apache-maven-3.9.6 folder inside dists
    del "%MAVEN_ZIP%"
)

@REM Run Maven
"%MAVEN_CMD%" %*
